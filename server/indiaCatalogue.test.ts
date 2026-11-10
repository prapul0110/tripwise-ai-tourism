import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { destinations, getCategoryFallbackImage } from "../client/src/data/destinations";

const jurisdictions = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

describe("India destination catalogue", () => {
  it("includes a travel gateway for every Indian state and union territory", () => {
    const represented = new Set(destinations.map(destination => destination.state));
    expect(destinations).toHaveLength(36);
    expect(jurisdictions.every(jurisdiction => represented.has(jurisdiction))).toBe(true);
  });

  it("assigns a dedicated, non-generic image to every state and union territory", () => {
    const usedImages = new Set<string>();

    for (const destination of destinations) {
      expect(destination.image).toBeDefined();
      expect(typeof destination.image).toBe("string");
      // Must not use generic india.jpg fallback
      expect(destination.image).not.toBe("/images/india.jpg");

      // Verify file exists on disk
      const localFilePath = path.resolve(__dirname, "../client/public", destination.image.replace(/^\//, ""));
      expect(fs.existsSync(localFilePath)).toBe(true);
      const stat = fs.statSync(localFilePath);
      expect(stat.size).toBeGreaterThan(50000); // Must be a real image > 50KB

      // Ensure distinct images across destinations (no accidental sharing)
      expect(usedImages.has(destination.image)).toBe(false);
      usedImages.add(destination.image);
    }

    expect(usedImages.size).toBe(36);
  });

  it("verifies targeted states have distinct and specific images", () => {
    const targets = [
      { state: "Telangana", city: "Hyderabad" },
      { state: "Andhra Pradesh", city: "Visakhapatnam" },
      { state: "Goa", city: "Goa" },
      { state: "Kerala", city: "Kerala" },
      { state: "Rajasthan", city: "Jaipur" },
      { state: "Maharashtra", city: "Mumbai" },
      { state: "Himachal Pradesh", city: "Manali" },
    ];

    const imagePaths = targets.map(target => {
      const dest = destinations.find(d => d.state === target.state && d.name === target.city);
      expect(dest).toBeDefined();
      return dest!.image;
    });

    const uniquePaths = new Set(imagePaths);
    expect(uniquePaths.size).toBe(targets.length);
  });

  it("provides appropriate category-based fallback images", () => {
    expect(getCategoryFallbackImage("Coast")).toBe("/images/destinations/goa.jpg");
    expect(getCategoryFallbackImage("Culture")).toBe("/images/destinations/jaipur.jpg");
    expect(getCategoryFallbackImage("Nature")).toBe("/images/destinations/kerala.jpg");
    expect(getCategoryFallbackImage("Mountains")).toBe("/images/destinations/manali.jpg");
    expect(getCategoryFallbackImage("City")).toBe("/images/destinations/mumbai.jpg");
    expect(getCategoryFallbackImage("Unknown")).toBe("/images/india.jpg");
  });
});
