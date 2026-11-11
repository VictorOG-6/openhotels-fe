import { isIsoDate } from "@/lib/hotels/format";
import { getLocation, LOCATIONS } from "@/lib/hotels/locations";
import type { StaySelection } from "@/lib/hotels/types";

type QueryReader = {
  get(name: string): string | null;
};

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function titleFromSlug(slug: string) {
  return decodeURIComponent(slug)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function defaultStay(leadDays = 21, nights = 3) {
  const start = new Date();
  start.setDate(start.getDate() + leadDays);
  const end = new Date(start);
  end.setDate(end.getDate() + nights);
  return {
    checkin: formatInputDate(start),
    checkout: formatInputDate(end),
  };
}

export function resolveDestination(input: string): StaySelection | null {
  const trimmed = input.trim();
  const slug = slugify(trimmed);
  if (!slug) return null;

  const known = LOCATIONS.find((location) => {
    const city = location.city.toLowerCase();
    const query = trimmed.toLowerCase();
    return (
      location.slug === slug ||
      city === query ||
      query.startsWith(`${city},`) ||
      query.startsWith(`${city} `)
    );
  });

  if (known) {
    return {
      slug: known.slug,
      city: known.city,
      country: known.country,
      countryCode: known.countryCode,
      latitude: known.latitude,
      longitude: known.longitude,
      checkin: "",
      checkout: "",
      adults: 2,
      children: 0,
      childAges: [],
      rooms: 1,
    };
  }

  return {
    slug,
    city: trimmed,
    country: "",
    checkin: "",
    checkout: "",
    adults: 2,
    children: 0,
    childAges: [],
    rooms: 1,
  };
}

export function readStay(params: QueryReader, slug: string): StaySelection {
  const known = getLocation(slug);
  const city = params.get("city")?.trim() || known?.city || titleFromSlug(slug);
  const countryCode = (params.get("country") || known?.countryCode || "")
    .trim()
    .toUpperCase();
  const checkin = params.get("checkin") || "";
  const checkout = params.get("checkout") || "";
  const datesValid =
    isIsoDate(checkin) && isIsoDate(checkout) && checkout > checkin;
  const children = clamp(numberFrom(params.get("children"), 0), 0, 8);
  const childAges = readAges(params.get("ages"), children);

  return {
    slug: known?.slug || slugify(slug) || slug,
    city,
    country: known?.country || "",
    countryCode: countryCode.length === 2 ? countryCode : undefined,
    latitude: known?.latitude,
    longitude: known?.longitude,
    checkin: datesValid ? checkin : "",
    checkout: datesValid ? checkout : "",
    adults: clamp(numberFrom(params.get("adults"), 2), 1, 10),
    children,
    childAges,
    rooms: clamp(numberFrom(params.get("rooms"), 1), 1, 8),
  };
}

export function buildBrowseHref(
  stay: StaySelection & { focus?: string },
) {
  const params = stayParams(stay);
  if (stay.focus) params.set("focus", stay.focus);
  return `/hotels/${encodeURIComponent(stay.slug)}?${params.toString()}`;
}

export function buildHotelHref(stay: StaySelection & { hotelId: string }) {
  return `/hotels/${encodeURIComponent(stay.slug)}/${encodeURIComponent(stay.hotelId)}?${stayParams(stay).toString()}`;
}

export function buildBookingHref(
  stay: StaySelection & {
    offerId: string;
    hotelId: string;
    hotelName: string;
    roomName: string;
  },
) {
  const params = stayParams(stay);
  params.set("offerId", stay.offerId);
  params.set("hotelId", stay.hotelId);
  params.set("location", stay.slug);
  params.set("hotel", stay.hotelName);
  params.set("room", stay.roomName);
  return `/booking?${params.toString()}`;
}

export function datesAreValid(checkin: string, checkout: string) {
  return isIsoDate(checkin) && isIsoDate(checkout) && checkout > checkin;
}

function stayParams(stay: StaySelection) {
  const params = new URLSearchParams();
  params.set("city", stay.city);
  if (stay.countryCode) params.set("country", stay.countryCode);
  if (stay.checkin) params.set("checkin", stay.checkin);
  if (stay.checkout) params.set("checkout", stay.checkout);
  params.set("adults", String(stay.adults));
  params.set("children", String(stay.children));
  params.set("rooms", String(stay.rooms));
  if (stay.childAges.length) params.set("ages", stay.childAges.join(","));
  return params;
}

function readAges(value: string | null, children: number) {
  const ages = (value || "")
    .split(",")
    .map((age) => Number(age))
    .filter((age) => Number.isInteger(age) && age >= 0 && age <= 17)
    .slice(0, children);

  while (ages.length < children) ages.push(8);
  return ages;
}

function numberFrom(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
