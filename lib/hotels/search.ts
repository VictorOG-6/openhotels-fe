import {
  errorMessage,
  fetchHotel,
  fetchHotelList,
  fetchRates,
  isAbortError,
} from "@/lib/hotels/api";
import {
  mergeStayHotels,
  readHotelDetail,
  readHotelList,
  readRatedHotels,
  readRoomOffers,
} from "@/lib/hotels/parse";
import type { HotelDetail, RoomOffer, SearchResult, StayHotel } from "@/lib/hotels/types";

type CityQuery = {
  city: string;
  countryCode?: string;
  limit?: number;
  signal?: AbortSignal;
};

type StayQuery = CityQuery & {
  checkin: string;
  checkout: string;
  adults: number;
  childAges: number[];
  rooms: number;
  hotelIds?: string[];
  maxRatesPerHotel?: number;
};

export async function listCityHotels({
  city,
  countryCode,
  limit = 4,
  signal,
}: CityQuery): Promise<StayHotel[]> {
  const payload = await fetchHotelList(
    { cityName: city, countryCode, limit },
    signal,
  );
  return readHotelList(payload);
}

export async function searchStays(query: StayQuery): Promise<SearchResult> {
  const [listedResult, ratedResult] = await Promise.allSettled([
    listCityHotels({
      city: query.city,
      countryCode: query.countryCode,
      limit: query.limit ?? 24,
      signal: query.signal,
    }),
    rateHotels(query),
  ]);

  if (query.signal?.aborted) throw abortError();

  const listed = listedResult.status === "fulfilled" ? listedResult.value : [];
  if (ratedResult.status === "fulfilled") {
    return { hotels: mergeStayHotels(listed, ratedResult.value), priced: true };
  }
  if (isAbortError(ratedResult.reason)) throw ratedResult.reason;
  if (listed.length) {
    return {
      hotels: listed,
      priced: false,
      warning: errorMessage(ratedResult.reason),
    };
  }
  if (listedResult.status === "rejected" && isAbortError(listedResult.reason)) {
    throw listedResult.reason;
  }
  throw ratedResult.reason;
}

export async function loadHotel(
  hotelId: string,
  signal?: AbortSignal,
): Promise<HotelDetail> {
  const payload = await fetchHotel(hotelId, signal);
  const hotel = readHotelDetail(payload);
  if (!hotel) throw new Error("The hotel record did not include a name.");
  return hotel;
}

export async function loadOffers(query: StayQuery): Promise<RoomOffer[]> {
  const payload = await fetchRates(
    {
      hotelIds: query.hotelIds,
      city: query.city,
      countryCode: query.countryCode,
      checkin: query.checkin,
      checkout: query.checkout,
      adults: query.adults,
      childAges: query.childAges,
      rooms: query.rooms,
      limit: query.limit ?? 1,
      maxRatesPerHotel: query.maxRatesPerHotel ?? 20,
    },
    query.signal,
  );
  return readRoomOffers(payload);
}

async function rateHotels(query: StayQuery) {
  const payload = await fetchRates(
    {
      city: query.hotelIds?.length ? undefined : query.city,
      countryCode: query.countryCode,
      hotelIds: query.hotelIds,
      checkin: query.checkin,
      checkout: query.checkout,
      adults: query.adults,
      childAges: query.childAges,
      rooms: query.rooms,
      limit: query.limit ?? 24,
      maxRatesPerHotel: query.maxRatesPerHotel ?? 1,
    },
    query.signal,
  );
  return readRatedHotels(payload);
}

function abortError() {
  return new DOMException("Search cancelled.", "AbortError");
}
