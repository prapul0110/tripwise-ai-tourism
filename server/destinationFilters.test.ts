import { describe, expect, it } from "vitest";
import { destinations } from "../client/src/data/destinations";
import { filterDestinations } from "../client/src/lib/destinationFilters";

describe("India explorer filters", () => {
  it("retains only the requested region and category across the nationwide catalogue", () => {
    const south = filterDestinations(destinations, { region: "South", category: "All", search: "" });
    const coast = filterDestinations(destinations, { region: "All", category: "Coast", search: "" });
    const southCoast = filterDestinations(destinations, { region: "South", category: "Coast", search: "" });

    expect(south.length).toBeGreaterThan(0);
    expect(south.every(destination => destination.region === "South")).toBe(true);
    expect(coast.length).toBeGreaterThan(0);
    expect(coast.every(destination => destination.category === "Coast")).toBe(true);
    expect(southCoast.every(destination => destination.region === "South" && destination.category === "Coast")).toBe(true);
  });
});
