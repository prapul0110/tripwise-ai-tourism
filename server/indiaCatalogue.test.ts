import { describe, expect, it } from "vitest";
import { destinations } from "../client/src/data/destinations";

const jurisdictions = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

describe("India destination catalogue", () => {
  it("includes a travel gateway for every Indian state and union territory", () => {
    const represented = new Set(destinations.map(destination => destination.state));
    expect(destinations).toHaveLength(36);
    expect(jurisdictions.every(jurisdiction => represented.has(jurisdiction))).toBe(true);
  });
});
