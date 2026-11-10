import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createSessionToken } from "./_core/authService";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM, listLLMModels, isAIConfigured } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createUserWithPassword, createTripForUser, deleteTripForUser, getSubscriptionForUser, getTravelProfileForUser, getTripForUser, getUserByEmail, listTripsForUser, setSubscriptionForUser, setTravelProfileForUser, updateLastSignedIn, updateTripForUser } from "./db";
import { buildDestinationItinerary, areAttractionsDuplicate, sanitizeGeminiJsonResponse } from "./itineraryEngine";
import { getDestination } from "../client/src/data/destinations";

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

export const transitInfoSchema = z.object({
  distanceKm: z.number(),
  durationMinutes: z.number(),
  formattedDistance: z.string(),
  formattedDuration: z.string(),
  source: z.enum(["google_maps", "estimate"]),
});

export const itinerarySchema = z.object({
  title: z.string().min(3).max(180),
  summary: z.string().min(10).max(1200),
  days: z.array(z.object({
    day: z.number().int().min(1).max(30),
    theme: z.string().min(1).max(120),
    totalDistanceKm: z.number().optional(),
    totalTransitMinutes: z.number().optional(),
    formattedDailyDistance: z.string().optional(),
    formattedDailyTransit: z.string().optional(),
    stops: z.array(z.object({
      id: z.string().optional(),
      time: z.string().min(1).max(80),
      title: z.string().min(1).max(180),
      location: z.string().min(1).max(180),
      description: z.string().min(0).max(1000).optional().default(""),
      duration: z.string().min(1).max(80),
      estimatedCost: z.number().int().min(0).max(500000).optional().default(0),
      stopType: z.enum(["attraction", "food"]).optional(),
      mealType: z.enum(["breakfast", "lunch", "dinner"]).optional(),
      specialties: z.array(z.string()).optional(),
      coords: z.object({ lat: z.number(), lng: z.number() }).optional(),
      transitToNext: transitInfoSchema.optional(),
    })).min(0).max(25),
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

export const accommodationSelectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(180),
  destinationId: z.string().optional(),
  type: z.string(),
  address: z.string(),
  coords: z.object({ lat: z.number(), lng: z.number() }),
  checkIn: z.string(),
  checkOut: z.string(),
  nights: z.number().min(1),
  roomType: z.string(),
  roomCount: z.number().min(1),
  guestCount: z.number().min(1),
  pricePerNight: z.number().min(0),
  totalCost: z.number().min(0),
  amenities: z.array(z.string()).default([]),
  bookingUrl: z.string().optional(),
  source: z.enum(["catalogue", "custom", "verified"]).default("catalogue"),
  isBreakfastIncluded: z.boolean().optional(),
});

const budgetBreakdownSchema = z.object({
  accommodation: z.number().int().min(0),
  food: z.number().int().min(0),
  transport: z.number().int().min(0),
  activities: z.number().int().min(0),
  total: z.number().int().min(1000),
  dailyPerTraveler: z.number().int().min(0),
});

export type TripInput = z.infer<typeof tripInput>;

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
  return sanitizeGeminiJsonResponse(content);
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
  const destination = getDestination(input.destination);
  const dailyBudget = Math.max(100, Math.round(input.budgetAmount / input.days));
  const usedItems: { id?: string; name: string }[] = [];

  return itinerarySchema.parse({
    title: skeleton.title,
    summary: skeleton.summary.length <= 320 ? skeleton.summary : `${skeleton.summary.slice(0, 319).trimEnd()}…`,
    days: skeleton.days.map((day, index) => {
      const primaryStyle = styles[index % styles.length] ?? "local discovery";

      // Prefer unscheduled points from destination catalogue
      const anchorPoint = (day.anchor && day.anchor.trim().length > 2
        ? destination.points.find(p => p.name.toLowerCase().includes(day.anchor.toLowerCase()) && !usedItems.some(u => areAttractionsDuplicate(u, p)))
        : null) || destination.points.find(p => !usedItems.some(u => areAttractionsDuplicate(u, p)));

      const anchorTitle = anchorPoint?.name ?? (day.anchor && day.anchor.trim().length > 2 ? day.anchor.trim() : `${destination.name} Morning`);
      if (anchorPoint) usedItems.push({ id: anchorPoint.id, name: anchorPoint.name });

      const secondPoint = destination.points.find(p => !usedItems.some(u => areAttractionsDuplicate(u, p)));
      const secondTitle = secondPoint?.name ?? `${destination.name} Heritage Quarter`;
      if (secondPoint) usedItems.push({ id: secondPoint.id, name: secondPoint.name });
      const secondDesc = secondPoint?.description || `A flexible local visit in ${destination.name} shaped around your ${primaryStyle} style.`;

      return {
        day: day.day,
        theme: day.theme,
        stops: [
          { time: "09:30", title: anchorTitle, location: destination.name, description: `A paced ${primaryStyle} visit centred on ${anchorTitle}.`, duration: "2–3 hours", estimatedCost: Math.round(dailyBudget * .28) },
          { time: "15:00", title: secondTitle, location: destination.name, description: secondDesc, duration: "2 hours", estimatedCost: Math.round(dailyBudget * .22) },
        ],
      };
    }),
  });
}

export function parseItinerarySkeleton(input: TripInput, content: unknown) {
  return hydrateItinerarySkeleton(input, itinerarySkeletonSchema.parse(JSON.parse(itineraryResponseText(content))));
}

export function isRecoverableItineraryResponse(error: unknown) {
  return error instanceof SyntaxError || error instanceof z.ZodError || (error instanceof Error && /no readable|incomplete/i.test(error.message));
}

export function fallbackItinerary(input: TripInput) {
  return buildDestinationItinerary(input, { isAiGenerated: false });
}

export async function generateItinerary(input: TripInput) {
  const destination = getDestination(input.destination);
  const aiReady = isAIConfigured();
  console.log(`[TripWise DevLog] Selected destination: "${input.destination}" (${destination.name})`);
  console.log(`[TripWise DevLog] AI Configured: ${aiReady}`);

  const baseResult = buildDestinationItinerary(input, { isAiGenerated: aiReady });
  const allStops = baseResult.days.flatMap(d => d.stops.map(s => s.title));
  console.log(`[TripWise DevLog] Calling generator: buildDestinationItinerary (server/itineraryEngine.ts)`);
  console.log(`[TripWise DevLog] Generated attractions & food places (${allStops.length} stops):`, allStops);

  if (!aiReady) {
    return { ...baseResult, generatedByAI: false as const };
  }

  try {
    const model = await withDeadline(getItineraryModel(), 3000, "The itinerary model is unavailable.");
    const brief = `You are TripWise. Write an evocative summary (25-45 words) and daily themes for a ${input.days}-day trip to ${destination.name}.
Styles: ${input.styles.join(", ")}.
Key stops: ${allStops.slice(0, 8).join(", ")}.
Return JSON only: { "summary": string, "themes": string[] } with exactly ${input.days} themes.`;

    const aiRes = await withDeadline(
      invokeLLM({
        model,
        maxTokens: 500,
        messages: [{ role: "user", content: brief }],
        response_format: { type: "json_object" },
      }),
      8000
    );

    const parsed = JSON.parse(itineraryResponseText(aiRes.choices[0]?.message?.content || "{}"));
    if (parsed.summary && typeof parsed.summary === "string" && parsed.summary.length >= 20) {
      baseResult.summary = parsed.summary.slice(0, 319);
    }
    if (Array.isArray(parsed.themes) && parsed.themes.length === baseResult.days.length) {
      baseResult.days.forEach((day, idx) => {
        if (typeof parsed.themes[idx] === "string" && parsed.themes[idx].length >= 3) {
          day.theme = parsed.themes[idx].slice(0, 79);
        }
      });
    }
    return { ...baseResult, generatedByAI: true as const };
  } catch (err) {
    console.warn("[TripWise] AI theme enrichment failed or timed out; returning authoritative plan:", err);
    return { ...baseResult, generatedByAI: false as const };
  }
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email("Please provide a valid email address").max(320),
          password: z.string().min(8, "Password must be at least 8 characters").max(100),
          name: z.string().trim().max(100).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const normalizedEmail = input.email.toLowerCase().trim();
        const existing = await getUserByEmail(normalizedEmail);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email address already exists.",
          });
        }

        const passwordHash = await bcrypt.hash(input.password, 10);
        const userId = await createUserWithPassword({
          email: normalizedEmail,
          passwordHash,
          name: input.name,
        });

        const user = {
          id: userId,
          openId: `usr_${userId}`,
          email: normalizedEmail,
          name: input.name || null,
        };

        const sessionToken = await createSessionToken(user);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: 1000 * 60 * 60 * 24 * 365,
        });

        return {
          success: true,
          user: {
            id: userId,
            email: normalizedEmail,
            name: input.name || null,
          },
        };
      }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email("Please provide a valid email address").max(320),
          password: z.string().min(1, "Password is required").max(100),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const normalizedEmail = input.email.toLowerCase().trim();
        const user = await getUserByEmail(normalizedEmail);
        if (!user || !user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }

        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }

        await updateLastSignedIn(user.id);

        const sessionToken = await createSessionToken({
          id: user.id,
          openId: user.openId,
          email: user.email,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: 1000 * 60 * 60 * 24 * 365,
        });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        };
      }),
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
    createTrip: protectedProcedure
      .input(
        tripInput.extend({
          title: z.string().min(3).max(180),
          summary: z.string().min(20).max(700),
          itinerary: itinerarySchema.shape.days,
          budget: budgetBreakdownSchema,
          accommodation: accommodationSelectionSchema.nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await createTripForUser({
          ...input,
          userId: ctx.user.id,
          budgetBreakdown: input.budget,
          itinerary: input.itinerary,
          accommodation: input.accommodation ?? null,
        });
        return { id };
      }),
    updateTrip: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          itinerary: itinerarySchema.shape.days,
          title: z.string().min(3).max(180).optional(),
          summary: z.string().min(10).max(1200).optional(),
          budgetBreakdown: budgetBreakdownSchema.optional(),
          accommodation: accommodationSelectionSchema.nullish(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const success = await updateTripForUser(ctx.user.id, input.id, {
          itinerary: input.itinerary,
          title: input.title,
          summary: input.summary,
          budgetBreakdown: input.budgetBreakdown,
          accommodation: input.accommodation,
        });

        if (!success) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to modify this trip, or the trip does not exist.",
          });
        }

        const freshTrip = await getTripForUser(ctx.user.id, input.id);
        return {
          success: true,
          trip: freshTrip,
        };
      }),
    deleteTrip: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const deleted = await deleteTripForUser(ctx.user.id, input.id);
        if (!deleted) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Trip not found or you do not have permission to delete it.",
          });
        }
        return { success: true };
      }),
  }),
  subscription: router({
    current: protectedProcedure.query(async ({ ctx }) => {
      const record = await getSubscriptionForUser(ctx.user.id);
      return {
        plan: "free" as const,
        status: "active" as const,
        provider: "community",
        renewalDate: null,
        isFullAccess: true,
        isUnlimited: true,
        ...(record ? { plan: record.plan, status: record.status } : {}),
      };
    }),
    selectDemoPlan: protectedProcedure
      .input(z.object({ plan: z.enum(["free", "pro"]).optional() }))
      .mutation(async () => ({
        success: true,
        message: "TripWise AI is completely free for all users.",
      })),
  }),
  profile: router({
    current: protectedProcedure.query(async ({ ctx }) => (await getTravelProfileForUser(ctx.user.id)) ?? { preferences: ["Slow mornings", "Local food", "Meaningful culture"] }),
    updatePreferences: protectedProcedure.input(z.object({ preferences: z.array(z.string().min(2).max(40)).min(1).max(8) })).mutation(({ ctx, input }) => setTravelProfileForUser(ctx.user.id, input.preferences)),
  }),
});

export type AppRouter = typeof appRouter;
