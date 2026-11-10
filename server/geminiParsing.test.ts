import { describe, expect, it } from "vitest";
import { tripInput, itineraryResponseText, itinerarySchema } from "./routers";
import {
  sanitizeGeminiJsonResponse,
  generateItineraryWithGemini,
  buildDestinationItinerary,
} from "./itineraryEngine";

const sampleInput = tripInput.parse({
  destination: "Goa",
  startDate: "2026-11-15",
  endDate: "2026-11-18",
  days: 4,
  travelers: 2,
  budgetTier: "Moderate",
  budgetAmount: 45000,
  styles: ["Relaxation", "Food"],
});

describe("Gemini JSON Response Parsing & Resilience", () => {
  it("sanitizes plain JSON without code fences", () => {
    const raw = JSON.stringify({ title: "Goa Explorer", days: [] });
    const sanitized = sanitizeGeminiJsonResponse(raw);
    expect(sanitized).toBe(raw);
    expect(JSON.parse(sanitized)).toEqual({ title: "Goa Explorer", days: [] });
  });

  it("sanitizes JSON wrapped in ```json markdown code fences", () => {
    const raw = "```json\n{\n  \"title\": \"Goa Explorer\",\n  \"days\": []\n}\n```";
    const sanitized = sanitizeGeminiJsonResponse(raw);
    expect(sanitized).toBe("{\n  \"title\": \"Goa Explorer\",\n  \"days\": []\n}");
    expect(JSON.parse(sanitized).title).toBe("Goa Explorer");
  });

  it("sanitizes JSON wrapped in plain ``` markdown code fences", () => {
    const raw = "```\n{\"title\": \"Goa Explorer\", \"days\": []}\n```";
    const sanitized = sanitizeGeminiJsonResponse(raw);
    expect(sanitized).toBe("{\"title\": \"Goa Explorer\", \"days\": []}");
    expect(JSON.parse(sanitized).title).toBe("Goa Explorer");
  });

  it("handles leading and trailing conversational text around code fences safely", () => {
    const raw = "Here is the customized itinerary for your trip:\n\n```json\n{\"title\": \"Goa Getaway\", \"days\": []}\n```\n\nEnjoy your travels!";
    const sanitized = sanitizeGeminiJsonResponse(raw);
    expect(JSON.parse(sanitized)).toEqual({ title: "Goa Getaway", days: [] });
  });

  it("handles multipart content arrays from Gemini / LLM streams", () => {
    const parts = [
      { type: "text", text: "```json\n" },
      { type: "text", text: "{\"title\": \"Goa Adventure\", \"days\": []}" },
      { type: "text", text: "\n```" },
    ];
    const sanitized = sanitizeGeminiJsonResponse(parts);
    expect(JSON.parse(sanitized).title).toBe("Goa Adventure");
  });

  it("throws a recoverable error when given empty or unreadable content", () => {
    expect(() => sanitizeGeminiJsonResponse("")).toThrow("The itinerary model returned no readable content.");
    expect(() => sanitizeGeminiJsonResponse("   \n\t  ")).toThrow("The itinerary model returned no readable content.");
  });

  it("itineraryResponseText delegates to sanitizeGeminiJsonResponse safely", () => {
    const raw = "```json\n{\"test\": 123}\n```";
    expect(itineraryResponseText(raw)).toBe("{\"test\": 123}");
  });

  it("generateItineraryWithGemini safely validates compliant itineraries", () => {
    const curated = buildDestinationItinerary(sampleInput, { isAiGenerated: true });
    const fencedPayload = `\`\`\`json\n${JSON.stringify(curated)}\n\`\`\``;

    const result = generateItineraryWithGemini(fencedPayload, sampleInput);
    expect(result.days).toHaveLength(4);
    expect(result.title).toContain("Goa");
  });

  it("does not silently accept malformed JSON and safely triggers curated fallback", () => {
    const malformed = "```json\n{ \"title\": \"Broken JSON... incomplete";
    const fallback = generateItineraryWithGemini(malformed, sampleInput);

    expect(fallback).toBeDefined();
    expect(fallback.days).toHaveLength(4);
    expect(fallback.days[0]!.stops.length).toBeGreaterThanOrEqual(2);
    expect(fallback.title).toContain("Goa");
  });

  it("does not silently accept incomplete daily plans (missing days) and falls back safely", () => {
    const incomplete = JSON.stringify({
      title: "Incomplete Trip",
      summary: "Too short",
      days: [{ day: 1, theme: "Day 1 only", stops: [{ time: "09:00", title: "Spot 1", location: "Goa", duration: "2h" }] }],
    });

    const fallback = generateItineraryWithGemini(incomplete, sampleInput);
    // Requested 4 days; incomplete only had 1 day -> fallback generates all 4 days
    expect(fallback.days).toHaveLength(4);
  });
});
