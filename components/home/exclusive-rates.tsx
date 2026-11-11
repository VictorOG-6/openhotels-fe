"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Photo, Stars } from "@/components/hotels/photo";
import { errorMessage, isAbortError } from "@/lib/hotels/api";
import { formatMoney, formatStayDate, nightsBetween } from "@/lib/hotels/format";
import { LOCATIONS } from "@/lib/hotels/locations";
import { buildHotelHref, defaultStay } from "@/lib/hotels/query";
import { searchStays } from "@/lib/hotels/search";
import type { StayHotel } from "@/lib/hotels/types";

type RateCard = StayHotel & {
  slug: string;
  countryCode?: string;
  checkin: string;
  checkout: string;
};

export default function ExclusiveRates() {
  const [attempt, setAttempt] = useState(0);
  return <RateList key={attempt} onRetry={() => setAttempt((value) => value + 1)} />;
}

function RateList({ onRetry }: { onRetry: () => void }) {
  const [cards, setCards] = useState<RateCard[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [dates, setDates] = useState<{ checkin: string; checkout: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const stay = defaultStay(14, 3);
    const featured = LOCATIONS.slice(0, 3);

    Promise.allSettled(
      featured.map((location) =>
        searchStays({
          city: location.city,
          countryCode: location.countryCode,
          checkin: stay.checkin,
          checkout: stay.checkout,
          adults: 2,
          childAges: [],
          rooms: 1,
          limit: 2,
          signal: controller.signal,
        }).then((result) =>
          result.hotels
            .filter((hotel) => hotel.price != null)
            .slice(0, 2)
            .map((hotel) => ({
              ...hotel,
              slug: location.slug,
              countryCode: location.countryCode,
              checkin: stay.checkin,
              checkout: stay.checkout,
            })),
        ),
      ),
    ).then((results) => {
      if (controller.signal.aborted) return;
      const next = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
      const failure = results.find((result) => result.status === "rejected" && !isAbortError(result.reason));
      setCards(next);
      setDates(stay);
      if (next.length) {
        setStatus("ready");
        setMessage("");
      } else {
        setStatus("error");
        setMessage(
          failure && failure.status === "rejected"
            ? errorMessage(failure.reason)
            : "Live rates are not available right now.",
        );
      }
    });

    return () => controller.abort();
  }, []);

  const nights = dates ? nightsBetween(dates.checkin, dates.checkout) : 0;

  return (
    <section id="rates" className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">Exclusive rates</p>
          <h2 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">Prices you can open tonight.</h2>
        </div>
        {dates ? (
          <p className="max-w-xs text-sm leading-6 text-muted">
            Two adults, {nights} nights, {formatStayDate(dates.checkin)} to {formatStayDate(dates.checkout)}.
          </p>
        ) : null}
      </div>

      {status === "loading" ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3" aria-hidden>
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-80 animate-pulse rounded-3xl bg-sand" />
          ))}
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-8 rounded-3xl bg-sand px-6 py-8">
          <p className="font-display text-3xl">Live rates are quiet right now.</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{message}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
            <Link href="/hotels" className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold">
              Browse cities
            </Link>
          </div>
        </div>
      ) : null}

      {status === "ready" ? (
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <li key={`${card.slug}-${card.id}`}>
              <Link
                href={buildHotelHref({
                  slug: card.slug,
                  city: card.city || card.slug,
                  country: "",
                  countryCode: card.countryCode,
                  checkin: card.checkin,
                  checkout: card.checkout,
                  adults: 2,
                  children: 0,
                  childAges: [],
                  rooms: 1,
                  hotelId: card.id,
                })}
                className="group block overflow-hidden rounded-3xl bg-white ring-1 ring-ink/8"
              >
                <div className="relative h-52">
                  <Photo src={card.image} alt="" className="absolute inset-0 transition duration-500 group-hover:scale-105" />
                </div>
                <div className="space-y-2 p-5">
                  <p className="text-sm text-muted">{card.city}</p>
                  <h3 className="font-display text-2xl leading-tight">{card.name}</h3>
                  <Stars value={card.stars} />
                  <p className="text-sm font-semibold">
                    {formatMoney(card.price || 0, card.currency || "USD")}
                    <span className="font-normal text-muted"> total</span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
