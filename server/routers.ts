import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM, listLLMModels } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createTripForUser, deleteTripForUser, getSubscriptionForUser, getTravelProfileForUser, getTripForUser, listTripsForUser, setSubscriptionForUser, setTravelProfileForUser } from "./db";

export const tripInput = z.object({
  destination: z.string().min(2).max(120),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.number().int().min(1).max(30),
  travelers: z.number().int().min(1).max(20),
  budgetTier: z.enum(["Budget", "Moderate", "Premium", "Luxury"]),
  budgetAmount: z.number().int().min(1000).max(2000000),
  styles: z.array(z.string().min(2).max(40)).min(1).max(8),
});

export const itinerarySchema = z.object({
  title: z.string().min(3).max(120),
  summary: z.string().min(20).max(320),
  days: z.array(z.object({
    day: z.number().int().min(1).max(30),
    theme: z.string().min(3).max(80),
    stops: z.array(z.object({
      time: z.string().min(2).max(80),
      title: z.string().min(2).max(120),
      location: z.string().min(2).max(120),
      description: z.string().min(10).max(500),
      duration: z.string().min(2).max(50),
      estimatedCost: z.number().int().min(0).max(500000),
    })).min(2).max(5),
  })).min(1).max(30),
});

export const itinerarySkeletonSchema = z.object({
  title: z.string().min(3).max(120),
  summary: z.string().min(20).max(1200),
  days: z.array(z.object({
    day: z.number().int().min(1).max(30),
    theme: z.string().min(3).max(80),
    anchor: z.string().min(2).max(100),
  })).min(1).max(30),
});

const budgetBreakdownSchema = z.object({
  accommodation: z.number().int().min(0),
  food: z.number().int().min(0),
  transport: z.number().int().min(0),
  activities: z.number().int().min(0),
  total: z.number().int().min(1000),
  dailyPerTraveler: z.number().int().min(0),
});

type TripInput = z.infer<typeof tripInput>;

let itineraryModelPromise: Promise<string | undefined> | undefined;

async function getItineraryModel() {
  if (!itineraryModelPromise) {
    itineraryModelPromise = listLLMModels()
      .then(({ data }) => data.find(item => item.id === "gemini-3-flash-preview")?.id ?? data.find(item => item.id === "claude-haiku-4-5")?.id ?? data.find(item => item.id === "gpt-5-nano")?.id ?? data.find(item => item.id === "gpt-5-mini")?.id ?? data[0]?.id)
      .catch(() => undefined);
  }
  return itineraryModelPromise;
}

export async function withDeadline<T>(operation: Promise<T>, milliseconds: number, message = "The itinerary service took too long to respond.") {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), milliseconds);
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function itineraryResponseText(content: unknown) {
  const text = typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.map(part => typeof part === "object" && part && "type" in part && part.type === "text" && "text" in part && typeof part.text === "string" ? part.text : "").join("")
      : "";
  const normalized = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  if (!normalized) throw new Error("The itinerary model returned no readable content.");
  return normalized;
}

export function parseItineraryPayload(input: TripInput, content: unknown) {
  const parsed = itinerarySchema.parse(JSON.parse(itineraryResponseText(content)));
  if (parsed.days.length !== input.days || parsed.days.some(day => day.stops.length < 2)) {
    throw new Error("The itinerary model returned an incomplete daily plan.");
  }
  return parsed;
}

export function hydrateItinerarySkeleton(input: TripInput, skeleton: z.infer<typeof itinerarySkeletonSchema>) {
  if (skeleton.days.length !== input.days) throw new Error("The itinerary model returned an incomplete daily plan.");
  const styles = input.styles.map(style => style.toLowerCase());
  return itinerarySchema.parse({
    title: skeleton.title,
    summary: skeleton.summary.length <= 320 ? skeleton.summary : `${skeleton.summary.slice(0, 319).trimEnd()}…`,
    days: skeleton.days.map((day, index) => {
      const dailyBudget = Math.max(100, Math.round(input.budgetAmount / input.days));
      const primaryStyle = styles[index % styles.length] ?? "local discovery";
      return {
        day: day.day,
        theme: day.theme,
        stops: [
          { time: "09:00", title: `Explore ${day.anchor}`, location: input.destination, description: `A paced ${primaryStyle} visit centred on ${day.anchor}.`, duration: "2–3 hours", estimatedCost: Math.round(dailyBudget * .24) },
          { time: "15:30", title: `${input.styles[(index + 1) % input.styles.length]} pause`, location: input.destination, description: "A flexible local experience that keeps the day comfortable and unhurried.", duration: "2 hours", estimatedCost: Math.round(dailyBudget * .18) },
        ],
      };
    }),
  });
}

export function parseItinerarySkeleton(input: TripInput, content: unknown) {
  return hydrateItinerarySkeleton(input, itinerarySkeletonSchema.parse(JSON.parse(itineraryResponseText(content))));
}

export function isRecoverableItineraryResponse(error: unknown) {
  return error instanceof SyntaxError || error instanceof z.ZodError || error instanceof Error && /no readable|incomplete/i.test(error.message);
}

export function fallbackItinerary(input: TripInput) {
  const styles = input.styles.join(", ").toLowerCase();
  return {
    title: `${input.destination} in ${input.days} days`,
    summary: `A paced ${input.days}-day ${input.destination} itinerary shaped around ${styles}, with flexible time for local discoveries and a clear daily spend guide.`,
    days: Array.from({ length: input.days }, (_, index) => ({
      day: index + 1,
      theme: index === 0 ? `Arrive & find your rhythm` : index === input.days - 1 ? `A considered finale` : `${input.styles[index % input.styles.length]} focus`,
      stops: [
        { time: "09:00", title: `Discover ${input.destination}`, location: input.destination, description: `Start with a context-setting local route designed for a ${input.styles[index % input.styles.length].toLowerCase()} traveller.`, duration: "2 hours", estimatedCost: Math.round(input.budgetAmount / input.days / 5) },
        { time: "13:00", title: "Local lunch pause", location: input.destination, description: "Leave time for a regional lunch and a comfortable reset before the afternoon.", duration: "90 minutes", estimatedCost: Math.round(input.budgetAmount / input.days / 8) },
        { time: "16:30", title: "Signature afternoon", location: input.destination, description: "Choose a flexible activity that fits the day’s pace and your selected travel styles.", duration: "2–3 hours", estimatedCost: Math.round(input.budgetAmount / input.days / 4) },
      ],
    })),
  };
}

async function generateItinerary(input: TripInput) {
  try {
    const model = await withDeadline(getItineraryModel(), 3000, "The itinerary model is unavailable.");
    const responseFormat = {
      type: "json_schema" as const,
      json_schema: {
        name: "tripwise_itinerary_skeleton",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" }, summary: { type: "string" }, days: {
              type: "array", items: { type: "object", properties: {
                day: { type: "integer" }, theme: { type: "string" }, anchor: { type: "string" },
              }, required: ["day", "theme", "anchor"], additionalProperties: false },
            },
          }, required: ["title", "summary", "days"], additionalProperties: false,
        },
      },
    };
    const tripBrief = `Create a ${input.days}-day itinerary for ${input.destination}, ${input.startDate} to ${input.endDate}; ${input.travelers} traveller(s); INR ${input.budgetAmount}; ${input.budgetTier}; preferences: ${input.styles.join(", ")}. Return exactly ${input.days} days. Each day needs only a concise theme and one specific landmark or neighbourhood anchor. Keep the summary under 55 words.`;
    let lastError: unknown;
    for (const attempt of [0, 1]) {
      try {
        const response = await withDeadline(invokeLLM({
          model,
          maxTokens: attempt === 0 ? 900 : 1100,
          messages: [
            { role: "system", content: attempt === 0 ? "You are TripWise, a practical India travel planner. Create feasible, unhurried plans. Do not invent reviews, opening hours, booking availability, exact live prices, or unsafe advice. Return only compact JSON matching the supplied schema." : "Return one complete, compact JSON itinerary skeleton only. Do not include markdown, commentary, or an incomplete object." },
            { role: "user", content: tripBrief },
          ],
          response_format: responseFormat,
        }), attempt === 0 ? 16000 : 10000);
        return { ...parseItinerarySkeleton(input, response.choices[0]?.message?.content), generatedByAI: true as const };
      } catch (error) {
        lastError = error;
        if (!isRecoverableItineraryResponse(error)) throw error;
      }
    }
    throw lastError;
  } catch (error) {
    console.error("[TripWise] Itinerary generation failed", error);
    return { ...fallbackItinerary(input), generatedByAI: false as const };
  }
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  travel: router({
    generateItinerary: protectedProcedure.input(tripInput).mutation(({ input }) => generateItinerary(input)),
    listTrips: protectedProcedure.query(({ ctx }) => listTripsForUser(ctx.user.id)),
    getTrip: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const trip = await getTripForUser(ctx.user.id, input.id);
      if (!trip) throw new TRPCError({ code: "NOT_FOUND", message: "This trip was not found." });
      return trip;
    }),
    createTrip: protectedProcedure.input(tripInput.extend({ title: z.string().min(3).max(180), summary: z.string().min(20).max(700), itinerary: itinerarySchema.shape.days, budget: budgetBreakdownSchema })).mutation(async ({ ctx, input }) => {
      const id = await createTripForUser({ ...input, userId: ctx.user.id, budgetBreakdown: input.budget, itinerary: input.itinerary });
      return { id };
    }),
    deleteTrip: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => ({ success: await deleteTripForUser(ctx.user.id, input.id) })),
  }),
  subscription: router({
    current: protectedProcedure.query(async ({ ctx }) => (await getSubscriptionForUser(ctx.user.id)) ?? { plan: "free", status: "active", provider: "demo", renewalDate: null }),
    selectDemoPlan: protectedProcedure.input(z.object({ plan: z.enum(["free", "pro"]) })).mutation(({ ctx, input }) => setSubscriptionForUser(ctx.user.id, input.plan)),
  }),
  profile: router({
    current: protectedProcedure.query(async ({ ctx }) => (await getTravelProfileForUser(ctx.user.id)) ?? { preferences: ["Slow mornings", "Local food", "Meaningful culture"] }),
    updatePreferences: protectedProcedure.input(z.object({ preferences: z.array(z.string().min(2).max(40)).min(1).max(8) })).mutation(({ ctx, input }) => setTravelProfileForUser(ctx.user.id, input.preferences)),
  }),
});

export type AppRouter = typeof appRouter;
