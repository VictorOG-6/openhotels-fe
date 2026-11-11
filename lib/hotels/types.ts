export type StayHotel = {
  id: string;
  name: string;
  description?: string;
  city?: string;
  country?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  stars?: number;
  rating?: number;
  reviewCount?: number;
  image?: string;
  facilities: string[];
  currency?: string;
  price?: number;
  refundable?: boolean;
  offerId?: string;
};

export type HotelRoom = {
  id: string;
  name: string;
  description?: string;
  occupancy?: number;
  image?: string;
};

export type HotelDetail = StayHotel & {
  images: string[];
  checkinTime?: string;
  checkoutTime?: string;
  importantInfo?: string;
  rooms: HotelRoom[];
};

export type RoomOffer = {
  offerId: string;
  name: string;
  boardName?: string;
  adults?: number;
  children?: number;
  price?: number;
  currency?: string;
  refundable?: boolean;
  cancellation?: string;
};

export type PrebookResult = {
  prebookId: string;
  price?: number;
  currency?: string;
  hotelName?: string;
  roomName?: string;
  boardName?: string;
  cancellation?: string;
  refundable?: boolean;
  priceDifferencePercent?: number;
  cancellationChanged: boolean;
  boardChanged: boolean;
  terms?: string;
};

export type BookingResult = {
  bookingId: string;
  status?: string;
  confirmationCode?: string;
  checkin?: string;
  checkout?: string;
  price?: number;
  currency?: string;
  hotelName?: string;
  hotelId?: string;
};

export type SearchResult = {
  hotels: StayHotel[];
  priced: boolean;
  warning?: string;
};

export type StaySelection = {
  slug: string;
  city: string;
  country: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  childAges: number[];
  rooms: number;
};
