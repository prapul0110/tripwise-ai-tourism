import type { Destination } from "@/data/destinations";

export type DestinationFilters = {
  region: string;
  category: string;
  search: string;
};

export function filterDestinations(destinations: Destination[], { region, category, search }: DestinationFilters) {
  const query = search.trim().toLowerCase();
  return destinations.filter(destination =>
    (region === "All" || destination.region === region)
    && (category === "All" || destination.category === category)
    && (!query || [destination.name, destination.state, destination.region, destination.category, ...destination.tags].some(value => value.toLowerCase().includes(query))),
  );
}
