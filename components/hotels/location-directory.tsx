"use client";

import { useEffect, useState } from "react";

import { Photo, Stars } from "@/components/hotels/photo";
import StayLink from "@/components/hotels/stay-link";
import { errorMessage, isAbortError } from "@/lib/hotels/api";
import { LOCATIONS, type CityLocation } from "@/lib/hotels/locations";
import { listCityHotels } from "@/lib/hotels/search";
import type { StayHotel } from "@/lib/hotels/types";

export default function LocationDirectory() {
  const [hotels, setHotels] = useState<Record<string, StayHotel[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const controller = new AbortController();
    const queue = [...LOCATIONS];

    const workers = Array.from({ length: 3 }, async () => {
      while (queue.length) {
        if (controller.signal.aborted) return;
        const location = queue.shift();
        if (!location) return;
        try {
          const list = await listCityHotels({
            city: location.city,
            countryCode: location.countryCode,
            limit: 4,
            signal: controller.signal,
          });
          setHotels((current) => ({ ...current, [location.slug]: list }));
        } catch (error) {
          if (isAbortError(error) || controller.signal.aborted) return;
          setErrors((current) => ({ ...current, [location.slug]: errorMessage(error) }));
        }
      }
    });

    void Promise.all(workers);
    return () => controller.abort();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-28 md:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">Hotels</p>
      <h1 className="mt-2 max-w-3xl font-display text-5xl tracking-tight md:text-6xl">
        Hotels in places people return to.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
        Pick a city to filter stays and see them on the map. A hotel here opens that city, not a single room.
      </p>
      <div className="mt-12 divide-y divide-line border-t border-line">
        {LOCATIONS.map((location) => (
          <LocationGroup
            key={location.slug}
            location={location}
            hotels={hotels[location.slug]}
            error={errors[location.slug]}
          />
        ))}
      </div>
    </div>
  );
}

function LocationGroup({
  location,
  hotels,
  error,
}: {
  location: CityLocation;
  hotels?: StayHotel[];
  error?: string;
}) {
  return (
    <article className="grid gap-6 py-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <StayLink location={location} className="group">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl md:aspect-[4/5]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={location.image}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        </div>
        <h2 className="mt-4 font-display text-4xl">{location.city}</h2>
        <p className="text-sm text-muted">{location.country}</p>
        <p className="mt-2 max-w-sm text-sm leading-6">{location.blurb}</p>
      </StayLink>
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">In {location.city}</p>
          <StayLink location={location} className="text-sm font-semibold text-clay">
            Browse {location.city}
          </StayLink>
        </div>
        {error ? <p className="mt-4 text-sm text-muted">{error} You can still open the city.</p> : null}
        {!hotels && !error ? (
          <div className="mt-4 space-y-3" aria-hidden>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-sand" />
            ))}
          </div>
        ) : null}
        {hotels && hotels.length === 0 && !error ? (
          <p className="mt-4 text-sm text-muted">No hotels were returned for {location.city} yet.</p>
        ) : null}
        <ul className="mt-4 divide-y divide-line">
          {hotels?.map((hotel) => (
            <li key={hotel.id}>
              <StayLink location={location} focus={hotel.id} className="flex items-center gap-4 py-3">
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-2xl">
                  <Photo src={hotel.image} alt="" className="absolute inset-0" />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{hotel.name}</span>
                  <Stars value={hotel.stars} />
                </span>
              </StayLink>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
