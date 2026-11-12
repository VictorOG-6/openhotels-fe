import { plainText } from "@/lib/hotels/format";
import type {
  BookingResult,
  HotelDetail,
  HotelRoom,
  PrebookResult,
  RoomOffer,
  StayHotel,
} from "@/lib/hotels/types";

export function readHotelList(payload: unknown): StayHotel[] {
  return dedupeHotels(
    collectRecords(payload)
      .filter((record) => !isRateRow(record))
      .map((record) => normalizeHotel(record))
      .filter((hotel): hotel is StayHotel => hotel != null),
  );
}

export function readRatedHotels(payload: unknown): StayHotel[] {
  const side = new Map(
    readHotelList(sideHotelPayload(payload)).map((hotel) => [hotel.id, hotel]),
  );
  const rated: StayHotel[] = [];

  for (const row of collectRateRows(payload)) {
    const id = pickId(row.hotelId, row.hotel_id, row.id);
    if (!id) continue;
    const nested =
      normalizeHotel(row.hotel) ??
      normalizeHotel(row.hotelData) ??
      side.get(id);
    const offer = readRoomOffers(row)[0];
    const base = nested ?? blankHotel(id);
    rated.push({
      ...base,
      id,
      name: base.name === id ? pickString(row.hotelName, row.name) || id : base.name,
      price: offer?.price ?? base.price,
      currency: offer?.currency ?? base.currency,
      refundable: offer?.refundable,
      offerId: offer?.offerId,
      image: base.image,
    });
  }

  return dedupeHotels(rated.length ? rated : [...side.values()]);
}

export function readHotelDetail(payload: unknown): HotelDetail | null {
  const root = asRecord(payload);
  const source = asRecord(root?.data) ?? root;
  const hotel = normalizeHotel(source);
  if (!hotel || !source) return null;

  const images = unique([hotel.image, ...readImages(source)].filter(Boolean) as string[]);

  return {
    ...hotel,
    image: images[0] || hotel.image,
    images,
    checkinTime: pickString(
      readPath(source, "checkinCheckoutTimes.checkinStart"),
      readPath(source, "checkinCheckoutTimes.checkin"),
    ),
    checkoutTime: pickString(readPath(source, "checkinCheckoutTimes.checkout")),
    importantInfo: textOrUndefined(
      pickString(source.hotelImportantInformation, source.importantInformation),
    ),
    rooms: readStaticRooms(source),
  };
}

export function readRoomOffers(payload: unknown): RoomOffer[] {
  const offers: RoomOffer[] = [];

  for (const row of collectRateRows(payload)) {
    if (!Array.isArray(row.roomTypes)) continue;
    for (const value of row.roomTypes) {
      const roomType = asRecord(value);
      const offerId = pickString(roomType?.offerId);
      if (!roomType || !offerId) continue;

      const rates = (Array.isArray(roomType.rates) ? roomType.rates : [])
        .map((rate) => asRecord(rate))
        .filter((rate): rate is Record<string, unknown> => rate != null);
      const retail = asRecord(roomType.offerRetailRate);
      let price = pickNumber(retail?.amount);
      let currency = pickString(retail?.currency);

      if (price == null && rates[0]) {
        const total = readPath(rates[0], "retailRate.total");
        const money = Array.isArray(total) ? asRecord(total[0]) : undefined;
        price = pickNumber(money?.amount);
        currency = currency ?? pickString(money?.currency);
      }

      const names = rates
        .map((rate) => pickString(rate.name))
        .filter((name): name is string => Boolean(name));
      const tags = rates.map((rate) =>
        pickString(readPath(rate, "cancellationPolicies.refundableTag")),
      );

      offers.push({
        offerId,
        name: names.join(" · ") || "Room",
        boardName: pickString(rates[0]?.boardName, rates[0]?.boardType),
        adults: pickNumber(rates[0]?.adultCount),
        children: pickNumber(rates[0]?.childCount),
        price,
        currency,
        refundable: tags.includes("RFN")
          ? true
          : tags.includes("NRFN")
            ? false
            : undefined,
        cancellation: rates[0] ? cancellationText(rates[0]) : undefined,
      });
    }
  }

  return offers.sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY));
}

export function readPrebook(payload: unknown): PrebookResult | null {
  const root = asRecord(payload);
  const data = asRecord(root?.data) ?? root;
  const prebookId = pickString(data?.prebookId, data?.prebook_id);
  if (!data || !prebookId) return null;

  const offer = readRoomOffers(data)[0];
  const hotel = normalizeHotel(data.hotel);

  return {
    prebookId,
    price: pickNumber(data.price) ?? offer?.price,
    currency: pickString(data.currency) ?? offer?.currency,
    hotelName: hotel?.name || pickString(data.hotelName),
    roomName: offer?.name,
    boardName: offer?.boardName,
    cancellation: offer?.cancellation,
    refundable: offer?.refundable,
    priceDifferencePercent: pickNumber(data.priceDifferencePercent),
    cancellationChanged: data.cancellationChanged === true,
    boardChanged: data.boardChanged === true,
    terms: textOrUndefined(pickString(data.termsAndConditions)),
  };
}

export function readBookingList(payload: unknown): BookingResult[] {
  const found: BookingResult[] = [];
  const seen = new Set<string>();
  const walked = new Set<unknown>();
  const visit = (value: unknown) => {
    if (!value || walked.has(value)) return;
    if (Array.isArray(value)) {
      walked.add(value);
      value.forEach(visit);
      return;
    }
    const record = asRecord(value);
    if (!record) return;
    walked.add(record);
    const bookingId = pickString(record.bookingId, record.booking_id);
    if (bookingId) {
      const parsed = readBooking(record);
      if (parsed && !seen.has(parsed.bookingId)) {
        seen.add(parsed.bookingId);
        found.push(parsed);
      }
    }
    visit(record.data);
    visit(record.bookings);
    visit(record.results);
  };
  visit(payload);
  return found;
}

export function readBooking(payload: unknown): BookingResult | null {
  const root = asRecord(payload);
  const data = asRecord(root?.data) ?? root;
  const bookingId = pickString(data?.bookingId, data?.booking_id, data?.id);
  if (!data || !bookingId) return null;

  const hotel = asRecord(data.hotel);
  return {
    bookingId,
    status: pickString(data.status),
    confirmationCode: pickString(
      data.hotelConfirmationCode,
      data.hotel_confirmation_code,
    ),
    checkin: pickString(data.checkin),
    checkout: pickString(data.checkout),
    price: pickNumber(data.price),
    currency: pickString(data.currency),
    hotelName: pickString(hotel?.name, data.hotelName),
    hotelId: pickId(hotel?.hotelId, hotel?.id),
  };
}

export function mergeStayHotels(listed: StayHotel[], rated: StayHotel[]) {
  const ratedById = new Map(rated.map((hotel) => [hotel.id, hotel]));
  const seen = new Set<string>();
  const merged: StayHotel[] = [];

  for (const hotel of listed) {
    seen.add(hotel.id);
    const rate = ratedById.get(hotel.id);
    merged.push(rate ? overlayHotel(hotel, rate) : hotel);
  }

  for (const hotel of rated) {
    if (!seen.has(hotel.id)) merged.push(hotel);
  }

  return merged;
}

function overlayHotel(base: StayHotel, rate: StayHotel): StayHotel {
  return {
    ...base,
    name: rate.name && rate.name !== rate.id ? rate.name : base.name,
    image: base.image || rate.image,
    description: base.description || rate.description,
    facilities: base.facilities.length ? base.facilities : rate.facilities,
    address: base.address || rate.address,
    city: base.city || rate.city,
    country: base.country || rate.country,
    latitude: base.latitude ?? rate.latitude,
    longitude: base.longitude ?? rate.longitude,
    stars: base.stars ?? rate.stars,
    rating: base.rating ?? rate.rating,
    reviewCount: base.reviewCount ?? rate.reviewCount,
    price: rate.price ?? base.price,
    currency: rate.currency || base.currency,
    refundable: rate.refundable,
    offerId: rate.offerId,
  };
}

function normalizeHotel(input: unknown): StayHotel | null {
  const raw = asRecord(input);
  if (!raw || isRateRow(raw)) return null;
  const id = pickId(raw.id, raw.hotelId, raw.hotel_id);
  const name = pickString(raw.name, raw.hotelName);
  if (!id || !name) return null;

  return {
    id,
    name,
    description: textOrUndefined(pickString(raw.hotelDescription, raw.description)),
    city: pickString(raw.city),
    country: pickString(raw.country),
    address: pickString(raw.address, raw.address1),
    latitude: pickNumber(
      raw.latitude,
      readPath(raw, "location.latitude"),
      readPath(raw, "position.latitude"),
    ),
    longitude: pickNumber(
      raw.longitude,
      readPath(raw, "location.longitude"),
      readPath(raw, "position.longitude"),
    ),
    stars: pickNumber(raw.stars, raw.starRating, raw.star_rating),
    rating: pickNumber(raw.rating, raw.guestRating),
    reviewCount: pickNumber(raw.reviewCount, raw.reviewsCount, raw.num_reviews),
    image: readImages(raw)[0],
    facilities: readFacilities(raw),
    currency: pickString(raw.currency),
  };
}

function readStaticRooms(raw: Record<string, unknown>): HotelRoom[] {
  if (!Array.isArray(raw.rooms)) return [];
  return raw.rooms.flatMap((value) => {
    const room = asRecord(value);
    if (!room) return [];
    const name = pickString(room.roomName, room.name);
    const id = pickId(room.id, room.roomId) || name;
    if (!name || !id) return [];
    return [
      {
        id,
        name,
        description: textOrUndefined(pickString(room.description)),
        occupancy: pickNumber(room.maxOccupancy, room.maxAdults),
        image: readImages(room)[0],
      },
    ];
  });
}

function cancellationText(rate: Record<string, unknown>) {
  const policies = asRecord(readPath(rate, "cancellationPolicies"));
  const tag = pickString(policies?.refundableTag);
  const info = Array.isArray(policies?.cancelPolicyInfos)
    ? asRecord(policies.cancelPolicyInfos[0])
    : undefined;
  const when = pickString(info?.cancelTime);
  const amount = pickNumber(info?.amount);
  const currency = pickString(info?.currency) || "USD";

  if (amount === 0) {
    return when ? `Free cancellation before ${when}` : "Free cancellation";
  }
  if (amount != null) {
    return `Cancellation fee ${Math.round(amount)} ${currency}${when ? ` from ${when}` : ""}`;
  }
  if (tag === "RFN") return "Refundable rate";
  if (tag === "NRFN") return "Non-refundable";
  return undefined;
}

function sideHotelPayload(payload: unknown) {
  const root = asRecord(payload);
  if (!root) return null;
  const data = asRecord(root.data);
  return {
    hotels: root.hotels ?? data?.hotels,
    data: data?.hotel ?? data?.hotels,
  };
}

function collectRecords(payload: unknown) {
  const records: Record<string, unknown>[] = [];
  const seen = new Set<unknown>();
  const visit = (value: unknown) => {
    if (!value || seen.has(value)) return;
    if (Array.isArray(value)) {
      seen.add(value);
      value.forEach(visit);
      return;
    }
    const record = asRecord(value);
    if (!record) return;
    seen.add(record);
    if (
      pickId(record.id, record.hotelId, record.hotel_id) &&
      pickString(record.name, record.hotelName)
    ) {
      records.push(record);
    }
    visit(record.data);
    visit(record.hotels);
    visit(record.hotel);
  };
  visit(payload);
  return records;
}

function collectRateRows(payload: unknown) {
  const rows: Record<string, unknown>[] = [];
  const seen = new Set<unknown>();
  const visit = (value: unknown) => {
    if (!value || seen.has(value)) return;
    if (Array.isArray(value)) {
      seen.add(value);
      value.forEach(visit);
      return;
    }
    const record = asRecord(value);
    if (!record) return;
    seen.add(record);
    if (Array.isArray(record.roomTypes)) rows.push(record);
    visit(record.data);
  };
  visit(payload);
  return rows;
}

function readImages(raw: Record<string, unknown>) {
  const urls: string[] = [];
  const push = (value: unknown) => {
    const url = pickString(value);
    if (url && /^https?:\/\//i.test(url)) urls.push(url);
  };

  push(raw.main_photo);
  push(raw.mainPhoto);
  push(raw.thumbnail);
  push(raw.image);
  push(raw.image_url);

  for (const key of ["hotelImages", "images", "photos"] as const) {
    const images = raw[key];
    if (!Array.isArray(images)) continue;
    for (const image of images) {
      if (typeof image === "string") push(image);
      const record = asRecord(image);
      push(record?.urlHd);
      push(record?.url);
      push(record?.thumbnail);
    }
  }

  return unique(urls);
}

function readFacilities(raw: Record<string, unknown>) {
  const values = raw.hotelFacilities ?? raw.facilities;
  if (!Array.isArray(values)) return [];
  return values
    .map((item) => {
      if (typeof item === "string") return item.trim();
      return pickString(asRecord(item)?.name) || "";
    })
    .filter(Boolean)
    .slice(0, 16);
}

function isRateRow(record: Record<string, unknown>) {
  return Array.isArray(record.roomTypes);
}

function blankHotel(id: string): StayHotel {
  return { id, name: id, facilities: [] };
}

function dedupeHotels(hotels: StayHotel[]) {
  const seen = new Set<string>();
  return hotels.filter((hotel) => {
    if (seen.has(hotel.id)) return false;
    seen.add(hotel.id);
    return true;
  });
}

function textOrUndefined(value?: string) {
  if (!value) return undefined;
  const text = plainText(value);
  return text || undefined;
}

function unique(values: string[]) {
  return [...new Set(values)];
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    const record = asRecord(current);
    return record ? record[key] : undefined;
  }, source);
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function pickId(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(value.trim())) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function pickNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
}
