export type CityLocation = {
  slug: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  image: string;
  blurb: string;
};

const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

export const LOCATIONS: CityLocation[] = [
  {
    slug: "paris",
    city: "Paris",
    country: "France",
    countryCode: "FR",
    latitude: 48.8566,
    longitude: 2.3522,
    image: photo("photo-1502602898657-3e91760cbb34"),
    blurb: "Courtyards, river hotels, and rooms above the evening rush.",
  },
  {
    slug: "rome",
    city: "Rome",
    country: "Italy",
    countryCode: "IT",
    latitude: 41.9028,
    longitude: 12.4964,
    image: photo("photo-1552832230-c0197dd311b5"),
    blurb: "Travertine, late dinners, and hotels inside the old city.",
  },
  {
    slug: "london",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    latitude: 51.5074,
    longitude: -0.1278,
    image: photo("photo-1513635269975-59663e0ac1ad"),
    blurb: "Townhouses, river views, and stations a short walk away.",
  },
  {
    slug: "new-york",
    city: "New York",
    country: "United States",
    countryCode: "US",
    latitude: 40.7128,
    longitude: -74.006,
    image: photo("photo-1496442226666-8d4d0e62e6e9"),
    blurb: "High floors, loud streets, and lobbies that stay open.",
  },
  {
    slug: "dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    latitude: 25.2048,
    longitude: 55.2708,
    image: photo("photo-1512453979798-5ea266f8880c"),
    blurb: "Towers, long pools, and desert light on the glass.",
  },
  {
    slug: "tokyo",
    city: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    latitude: 35.6762,
    longitude: 139.6503,
    image: photo("photo-1540959733332-eab4deabeeaf"),
    blurb: "Compact rooms, quiet service, and a different city each block.",
  },
  {
    slug: "barcelona",
    city: "Barcelona",
    country: "Spain",
    countryCode: "ES",
    latitude: 41.3874,
    longitude: 2.1686,
    image: photo("photo-1539037116277-4db20889f2d4"),
    blurb: "Balconies, tiled floors, and the sea at the end of the grid.",
  },
  {
    slug: "cape-town",
    city: "Cape Town",
    country: "South Africa",
    countryCode: "ZA",
    latitude: -33.9249,
    longitude: 18.4241,
    image: photo("photo-1580060839134-75a5edca2e99"),
    blurb: "The mountain on one side and the Atlantic on the other.",
  },
  {
    slug: "singapore",
    city: "Singapore",
    country: "Singapore",
    countryCode: "SG",
    latitude: 1.3521,
    longitude: 103.8198,
    image: photo("photo-1525625293386-3f8f99389edd"),
    blurb: "Gardens, hawker streets, and hotels built for short connections.",
  },
  {
    slug: "lagos",
    city: "Lagos",
    country: "Nigeria",
    countryCode: "NG",
    latitude: 6.5244,
    longitude: 3.3792,
    image: photo("photo-1618828665011-0abd973f7bb8"),
    blurb: "Island hotels, ocean air, and a city that does not slow down.",
  },
];

export function getLocation(slug: string) {
  return LOCATIONS.find((location) => location.slug === slug);
}
