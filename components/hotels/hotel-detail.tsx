"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Photo, Stars } from "@/components/hotels/photo";
import SearchBar from "@/components/search/search-bar";
import { errorMessage, isAbortError } from "@/lib/hotels/api";
import {
  formatMoney,
  formatStayDate,
  guestLabel,
  nightsBetween,
} from "@/lib/hotels/format";
import {
  buildBookingHref,
  buildBrowseHref,
  buildHotelHref,
  datesAreValid,
  readStay,
} from "@/lib/hotels/query";
import { loadHotel, loadOffers } from "@/lib/hotels/search";
import type { HotelDetail, RoomOffer } from "@/lib/hotels/types";

const HotelMap = dynamic(() => import("@/components/hotels/hotel-map"), {
  ssr: false,
});

export default function HotelDetailView() {
  const params = useParams<{ location: string; hotelId: string }>();
  const hotelId = one(params.hotelId);
  const slug = one(params.location);
  return <HotelDetailBody key={hotelId} hotelId={hotelId} slug={slug} />;
}

function HotelDetailBody({ hotelId, slug }: { hotelId: string; slug: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const stay = readStay(searchParams, slug);
  const dated = datesAreValid(stay.checkin, stay.checkout);
  const offerKey = [
    hotelId,
    stay.checkin,
    stay.checkout,
    stay.adults,
    stay.childAges.join(","),
    stay.rooms,
  ].join("|");

  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [hotelError, setHotelError] = useState("");
  const [hotelStatus, setHotelStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [offers, setOffers] = useState<RoomOffer[]>([]);
  const [offerStatus, setOfferStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [offerError, setOfferError] = useState("");
  const [loadedOfferKey, setLoadedOfferKey] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    loadHotel(hotelId, controller.signal).then(
      (result) => {
        setHotel(result);
        setHotelStatus("ready");
        document.title = `${result.name} · Open Hotels`;
      },
      (error: unknown) => {
        if (isAbortError(error)) return;
        setHotel(null);
        setHotelError(errorMessage(error));
        setHotelStatus("error");
      },
    );
    return () => controller.abort();
  }, [hotelId]);

  useEffect(() => {
    if (!dated) return;
    const controller = new AbortController();
    loadOffers({
      city: stay.city,
      countryCode: stay.countryCode,
      hotelIds: [hotelId],
      checkin: stay.checkin,
      checkout: stay.checkout,
      adults: stay.adults,
      childAges: stay.childAges,
      rooms: stay.rooms,
      maxRatesPerHotel: 20,
      signal: controller.signal,
    }).then(
      (result) => {
        setOffers(result);
        setOfferStatus("ready");
        setLoadedOfferKey(offerKey);
      },
      (error: unknown) => {
        if (isAbortError(error)) return;
        setOffers([]);
        setOfferError(errorMessage(error));
        setOfferStatus("error");
        setLoadedOfferKey(offerKey);
      },
    );
    return () => controller.abort();
    // offerKey already captures the stay fields that should refetch rates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerKey, dated]);

  const nights = nightsBetween(stay.checkin, stay.checkout);
  const offersPending = dated && loadedOfferKey !== offerKey;
  const images = hotel?.images.length
    ? hotel.images
    : hotel?.image
      ? [hotel.image]
      : [];
  const mapHotel =
    hotel?.latitude != null && hotel.longitude != null
      ? [
          {
            id: hotel.id,
            name: hotel.name,
            latitude: hotel.latitude,
            longitude: hotel.longitude,
            priceLabel:
              offers[0]?.price != null
                ? formatMoney(offers[0].price, offers[0].currency || "USD")
                : "Stay",
          },
        ]
      : [];

  return (
    <article className="mx-auto max-w-6xl px-5 pb-28 pt-24 md:px-8">
      <Link
        href={buildBrowseHref(stay)}
        className="text-sm font-medium text-neutral-500 hover:text-ink"
      >
        Back to {stay.city}
      </Link>

      {hotelStatus === "loading" ? (
        <div className="mt-6 h-80 animate-pulse rounded-3xl bg-sand" />
      ) : null}

      {hotelStatus === "error" ? (
        <div className="mt-8 rounded-3xl bg-white p-8 ring-1 ring-ink/5">
          <h1 className="font-display text-4xl">
            This hotel could not be opened.
          </h1>
          <p className="mt-3 text-sm text-neutral-500">{hotelError}</p>
        </div>
      ) : null}

      {hotel ? (
        <>
          <div className="mt-5 grid gap-2 md:h-[420px] md:grid-cols-4 md:grid-rows-2">
            <div className="relative min-h-64 overflow-hidden rounded-3xl md:col-span-2 md:row-span-2">
              <Photo
                src={images[0]}
                alt={`${hotel.name} photo`}
                className="absolute inset-0"
              />
            </div>
            {images.slice(1, 5).map((image) => (
              <div
                key={image}
                className="relative hidden min-h-32 overflow-hidden rounded-3xl md:block"
              >
                <Photo src={image} alt="" className="absolute inset-0" />
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.7fr)]">
            <div>
              <p className="text-sm text-neutral-500">
                {[
                  hotel.address,
                  hotel.city || stay.city,
                  hotel.country || stay.country,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <h1 className="mt-2 font-display text-5xl tracking-tight">
                {hotel.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Stars value={hotel.stars} />
                {hotel.rating != null ? (
                  <p className="text-sm font-medium">
                    Guest score {hotel.rating}
                    {hotel.reviewCount ? ` · ${hotel.reviewCount} reviews` : ""}
                  </p>
                ) : null}
              </div>
              {hotel.description ? (
                <p className="mt-6 max-w-2xl whitespace-pre-line text-base leading-7 text-neutral-500">
                  {hotel.description}
                </p>
              ) : null}

              {hotel.facilities.length ? (
                <section className="mt-8">
                  <h2 className="font-display text-2xl">Facilities</h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {hotel.facilities.map((facility) => (
                      <li
                        key={facility}
                        className="rounded-full bg-sand px-3 py-1.5 text-sm"
                      >
                        {facility}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section id="rooms" className="mt-10 scroll-mt-28">
                <h2 className="font-display text-3xl">Choose a room</h2>
                <p className="mt-2 text-sm text-neutral-500">
                  {dated
                    ? `${formatStayDate(stay.checkin)} – ${formatStayDate(stay.checkout)} · ${guestLabel(stay.adults, stay.children, stay.rooms)}`
                    : "Add dates to load rooms you can prebook."}
                </p>
                <div className="mt-4">
                  <SearchBar
                    key={offerKey}
                    hideLocation
                    destination={stay}
                    submitLabel="Update"
                    initial={{
                      location: stay.city,
                      checkin: stay.checkin,
                      checkout: stay.checkout,
                      adults: stay.adults,
                      children: stay.children,
                      childAges: stay.childAges,
                      rooms: stay.rooms,
                    }}
                    onSubmit={(next) => {
                      router.replace(
                        buildHotelHref({ ...stay, ...next, hotelId }),
                        { scroll: false },
                      );
                    }}
                  />
                </div>

                {!offersPending && offerError ? (
                  <p
                    className="mt-4 rounded-2xl bg-sand px-4 py-3 text-sm"
                    role="alert"
                  >
                    {offerError}
                  </p>
                ) : null}

                {offersPending ? (
                  <div className="mt-4 space-y-3" aria-hidden>
                    <div className="h-32 animate-pulse rounded-3xl bg-sand" />
                    <div className="h-32 animate-pulse rounded-3xl bg-sand" />
                  </div>
                ) : null}

                {!offersPending &&
                offerStatus === "ready" &&
                offers.length === 0 ? (
                  <p className="mt-4 rounded-3xl bg-white p-6 text-sm ring-1 ring-ink/5">
                    No rooms are available for these dates. Try a different
                    stay.
                  </p>
                ) : null}

                <ul className="mt-4 space-y-3">
                  {!offersPending && offerStatus === "ready"
                    ? offers.map((offer) => (
                        <li
                          key={offer.offerId}
                          className="rounded-3xl bg-white p-5 ring-1 ring-ink/8"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <h3 className="font-display text-2xl">
                                {offer.name}
                              </h3>
                              <p className="mt-1 text-sm text-neutral-500">
                                {[
                                  offer.boardName,
                                  offer.adults ? `${offer.adults} adults` : "",
                                  offer.refundable === true
                                    ? "Refundable"
                                    : offer.refundable === false
                                      ? "Non-refundable"
                                      : "",
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                              {offer.cancellation ? (
                                <p className="mt-2 text-sm text-pine">
                                  {offer.cancellation}
                                </p>
                              ) : null}
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-xl font-semibold">
                                {offer.price != null
                                  ? formatMoney(
                                      offer.price,
                                      offer.currency || "USD",
                                    )
                                  : "Rate pending"}
                              </p>
                              {nights > 0 ? (
                                <p className="text-xs text-neutral-500">
                                  total for {nights} night
                                  {nights === 1 ? "" : "s"}
                                </p>
                              ) : null}
                              <Link
                                href={buildBookingHref({
                                  ...stay,
                                  offerId: offer.offerId,
                                  hotelId,
                                  hotelName: hotel.name,
                                  roomName: offer.name,
                                })}
                                className="mt-3 inline-flex rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-white hover:bg-clay-dark"
                              >
                                Prebook this rate
                              </Link>
                            </div>
                          </div>
                        </li>
                      ))
                    : null}
                </ul>

                {hotel.rooms.length ? (
                  <div className="mt-8">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-500">
                      Room types at the hotel
                    </h3>
                    <ul className="mt-3 divide-y divide-line">
                      {hotel.rooms.slice(0, 8).map((room) => (
                        <li key={room.id} className="py-3">
                          <p className="font-medium">{room.name}</p>
                          {room.description ? (
                            <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
                              {room.description}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <div className="h-72 overflow-hidden rounded-3xl">
                <HotelMap
                  hotels={mapHotel}
                  center={
                    mapHotel[0]
                      ? {
                          lat: mapHotel[0].latitude,
                          lng: mapHotel[0].longitude,
                        }
                      : undefined
                  }
                />
              </div>
              <div className="rounded-3xl bg-white p-5 ring-1 ring-ink/8">
                <p className="text-sm text-neutral-500">Stay</p>
                <p className="mt-1 font-medium">
                  {dated
                    ? `${formatStayDate(stay.checkin)} – ${formatStayDate(stay.checkout)}`
                    : "Dates not selected"}
                </p>
                <p className="mt-3 text-sm text-neutral-500">
                  Check-in {hotel.checkinTime || "set by the hotel"}
                  <br />
                  Check-out {hotel.checkoutTime || "set by the hotel"}
                </p>
                {hotel.importantInfo ? (
                  <p className="mt-3 line-clamp-6 text-sm leading-6 text-neutral-500">
                    {hotel.importantInfo}
                  </p>
                ) : null}
                <a
                  href="#rooms"
                  className="mt-4 inline-flex text-sm font-semibold text-clay"
                >
                  Choose a room
                </a>
              </div>
            </aside>
          </div>
        </>
      ) : null}
    </article>
  );
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}
