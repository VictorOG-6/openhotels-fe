"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Photo, Stars } from "@/components/hotels/photo";
import { errorMessage, isAbortError } from "@/lib/hotels/api";
import {
  formatMoney,
  formatStayDate,
  nightsBetween,
} from "@/lib/hotels/format";
import { buildBookingHref, buildHotelHref } from "@/lib/hotels/query";
import {
  HOME_EXCLUSIVE_RATES,
  loadHomeExclusiveRates,
  type ExclusiveRateSlide,
} from "@/lib/hotels/search";

export default function ExclusiveRates() {
  const [attempt, setAttempt] = useState(0);
  return (
    <RateList key={attempt} onRetry={() => setAttempt((value) => value + 1)} />
  );
}

function RateList({ onRetry }: { onRetry: () => void }) {
  const [cards, setCards] = useState<ExclusiveRateSlide[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    loadHomeExclusiveRates(controller.signal).then(
      (offers) => {
        if (controller.signal.aborted) return;
        setCards(offers);
        if (offers.length) {
          setStatus("ready");
          setMessage("");
        } else {
          setStatus("error");
          setMessage("Live rates are not available right now.");
        }
      },
      (error: unknown) => {
        if (isAbortError(error)) return;
        setCards([]);
        setStatus("error");
        setMessage(errorMessage(error));
      },
    );

    return () => controller.abort();
  }, []);

  const { checkin, checkout } = HOME_EXCLUSIVE_RATES;
  const nights = nightsBetween(checkin, checkout);
  const hotelName = cards[0]?.hotelName;

  return (
    <section
      id="rates"
      className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">
            Exclusive rates
          </p>
          <h2 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
            Prices you can open tonight.
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-neutral-500">
          {nights} nights, {formatStayDate(checkin)} to {formatStayDate(checkout)}
          {hotelName ? (
            <>
              {" "}
              · {hotelName}
            </>
          ) : null}
          . Mixed occupancies (2 adults + child 11, and 1 adult).
        </p>
      </div>

      {status === "loading" ? (
        <div
          className="mt-8 flex gap-4 overflow-hidden"
          aria-hidden
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-80 w-[min(85vw,18rem)] shrink-0 animate-pulse rounded-3xl bg-sand"
            />
          ))}
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-8 rounded-3xl bg-sand px-6 py-8">
          <p className="font-display text-3xl">
            Live rates are quiet right now.
          </p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
            {message}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
            <Link
              href="/hotels"
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold"
            >
              Browse cities
            </Link>
          </div>
        </div>
      ) : null}

      {status === "ready" ? (
        <div className="relative mt-8">
          <div className="-mx-5 md:-mx-8">
            <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-5 pb-3 pt-1 md:px-8 [scrollbar-width:thin]">
              {cards.map((card) => (
                <li
                  key={card.offerId}
                  className="w-[min(85vw,18rem)] shrink-0 snap-start"
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-ink/8">
                    <div className="relative h-40">
                      <Photo
                        src={card.hotelImage}
                        alt=""
                        className="absolute inset-0"
                      />
                    </div>
                    <div className="flex flex-1 flex-col space-y-2 p-5">
                      <p className="text-sm text-neutral-500">
                        {card.city || card.hotelName}
                      </p>
                      <h3 className="font-display text-xl leading-tight">
                        {card.name}
                      </h3>
                      {card.stars != null ? <Stars value={card.stars} /> : null}
                      {card.boardName ? (
                        <p className="text-sm text-neutral-500">{card.boardName}</p>
                      ) : null}
                      <p className="text-sm font-semibold">
                        {formatMoney(card.price || 0, card.currency || "USD")}
                        <span className="font-normal text-neutral-500"> total</span>
                      </p>
                      <div className="mt-auto flex flex-col gap-2 pt-2">
                        <Link
                          href={buildBookingHref({
                            slug: card.slug,
                            city: card.city || card.hotelName,
                            country: "",
                            countryCode: card.countryCode,
                            checkin: card.checkin,
                            checkout: card.checkout,
                            adults: 2,
                            children: 1,
                            childAges: [11],
                            rooms: 1,
                            offerId: card.offerId,
                            hotelId: card.hotelId,
                            hotelName: card.hotelName,
                            roomName: card.name,
                          })}
                          className="rounded-full bg-clay px-4 py-2 text-center text-sm font-semibold text-white hover:bg-clay-dark"
                        >
                          Prebook
                        </Link>
                        <Link
                          href={buildHotelHref({
                            slug: card.slug,
                            city: card.city || card.hotelName,
                            country: "",
                            countryCode: card.countryCode,
                            checkin: card.checkin,
                            checkout: card.checkout,
                            adults: 2,
                            children: 1,
                            childAges: [11],
                            rooms: 1,
                            hotelId: card.hotelId,
                          })}
                          className="text-center text-xs font-medium text-neutral-500 hover:text-ink"
                        >
                          Hotel details
                        </Link>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-xs text-neutral-400 md:pl-0">
            Scroll sideways to compare {cards.length} live room rates.
          </p>
        </div>
      ) : null}
    </section>
  );
}