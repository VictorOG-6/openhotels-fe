import { asRecord } from "@/lib/hotels/parse";

const CURRENCY = "USD";
const NATIONALITY = "US";

export class HotelApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HotelApiError";
    this.status = status;
  }
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function errorMessage(error: unknown) {
  if (isAbortError(error)) return "Search cancelled.";
  if (error instanceof HotelApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong while talking to the hotel service.";
}

type ListParams = {
  cityName: string;
  countryCode?: string;
  limit?: number;
};

type RateParams = {
  city?: string;
  countryCode?: string;
  hotelIds?: string[];
  checkin: string;
  checkout: string;
  adults: number;
  childAges: number[];
  rooms: number;
  limit?: number;
  maxRatesPerHotel?: number;
};

export type BookPayload = {
  prebookId: string;
  holder: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  guests: Array<{
    occupancyNumber: number;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  payment: {
    method: "ACC_CREDIT_CARD" | "WALLET" | "CREDIT";
  };
};

export function fetchHotelList(params: ListParams, signal?: AbortSignal) {
  return request(`/hotels${toQuery({
    cityName: params.cityName,
    countryCode: params.countryCode,
    limit: params.limit ?? 24,
    language: "en",
  })}`, { signal });
}

export function fetchHotel(hotelId: string, signal?: AbortSignal) {
  return request(`/hotels/${encodeURIComponent(hotelId)}?language=en`, { signal });
}

export function fetchRates(params: RateParams, signal?: AbortSignal) {
  const occupancy: Record<string, unknown> = {
    adults: params.adults,
    rooms: params.rooms,
  };
  if (params.childAges.length) occupancy.children = params.childAges;

  const body: Record<string, unknown> = {
    occupancies: [occupancy],
    currency: CURRENCY,
    guestNationality: NATIONALITY,
    checkin: params.checkin,
    checkout: params.checkout,
    timeout: 20,
    roomMapping: true,
    includeHotelData: true,
    maxRatesPerHotel: params.maxRatesPerHotel ?? 1,
    limit: params.limit ?? 24,
    sort: [{ field: "price", direction: "ascending" }],
  };

  if (params.hotelIds?.length) {
    body.hotelIds = params.hotelIds;
  } else if (params.city) {
    body.cityName = params.city;
    if (params.countryCode) body.countryCode = params.countryCode;
  }

  return request("/hotels/rates", {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });
}

export function fetchPrebook(offerId: string, signal?: AbortSignal) {
  return request("/hotels/prebook", {
    method: "POST",
    body: JSON.stringify({ offerId, usePaymentSdk: false }),
    signal,
  });
}

export function fetchBook(payload: BookPayload) {
  return request("/hotels/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchBooking(bookingId: string, signal?: AbortSignal) {
  return request(`/hotels/bookings/${encodeURIComponent(bookingId)}`, { signal });
}

export function fetchBookings(signal?: AbortSignal) {
  const end = new Date();
  end.setDate(end.getDate() + 1);
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  return request(
    `/hotels/bookings${toQuery({
      bookingStartDate: isoDay(start),
      bookingEndDate: isoDay(end),
    })}`,
    { signal },
  );
}

function isoDay(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

async function request(path: string, init: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) {
    throw new HotelApiError(
      "Live hotel rates need NEXT_PUBLIC_API_URL in the environment.",
      0,
    );
  }

  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("access_token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new HotelApiError("We couldn't reach the hotel service.", 0);
  }

  const payload = await readBody(response);
  if (!response.ok) {
    throw new HotelApiError(detailMessage(payload, response.status), response.status);
  }
  return payload;
}

async function readBody(response: Response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { detail: text.slice(0, 400) };
  }
}

function detailMessage(payload: unknown, status: number) {
  const record = asRecord(payload);
  const detail = record?.detail ?? record?.message;
  if (typeof detail === "string" && detail.trim()) return detail.trim();
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        const error = asRecord(item);
        const message = typeof error?.msg === "string" ? error.msg : "";
        if (!message) return "";
        const loc = Array.isArray(error?.loc)
          ? error.loc
              .filter((part) => part !== "body" && part !== "query")
              .join(".")
          : "";
        return loc ? `${loc}: ${message}` : message;
      })
      .filter(Boolean);
    if (messages.length) return messages.join(" ");
  }
  if (status === 404) return "That hotel or booking could not be found.";
  if (status === 503) return "The hotel provider is not configured.";
  return "The hotel service could not complete that request.";
}

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}
