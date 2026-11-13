"use client";

import dynamic from "next/dynamic";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import HotelCard from "@/components/hotels/hotel-card";
import type { MapHotel } from "@/components/hotels/hotel-map";
import StayFilters from "@/components/hotels/stay-filters";
import SearchBar from "@/components/search/search-bar";
import { errorMessage, isAbortError } from "@/lib/hotels/api";
import { formatMoney, nightsBetween, scoreOutOfTen } from "@/lib/hotels/format";
import { buildHotelHref, datesAreValid, readStay } from "@/lib/hotels/query";
import { listCityHotels, searchStays } from "@/lib/hotels/search";
import type { StayHotel } from "@/lib/hotels/types";

const HotelMap = dynamic(() => import("@/components/hotels/hotel-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-80 animate-pulse rounded-3xl bg-sand" />
  ),
});

export default function HotelBrowse() {
  const params = useParams<{ location: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = one(params.location);
  const stay = readStay(searchParams, slug);
  const focus = searchParams.get("focus") || "";
  const filters = {
    sort: searchParams.get("sort") || "recommended",
    stars: searchParams.get("stars") || "",
    score: searchParams.get("score") || "",
    refundable: searchParams.get("refundable") === "1",
    maxPrice: searchParams.get("max") || "",
    query: searchParams.get("q") || "",
  };
  const searchKey = [
    stay.slug,
    stay.city,
    stay.countryCode || "",
    stay.checkin,
    stay.checkout,
    stay.adults,
    stay.children,
    stay.childAges.join(","),
    stay.rooms,
  ].join("|");

  const [hotels, setHotels] = useState<StayHotel[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [priced, setPriced] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [loadedKey, setLoadedKey] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const ages = stay.childAges.join(",");
  const { city, countryCode, checkin, checkout, adults, rooms } = stay;

  const updateParams = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (!value) next.delete(key);
        else next.set(key, value);
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    const frame = window.requestAnimationFrame(update);
    media.addEventListener("change", update);
    return () => {
      window.cancelAnimationFrame(frame);
      media.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const childAges = ages ? ages.split(",").map(Number) : [];
    const hasDates = datesAreValid(checkin, checkout);

    const request = hasDates
      ? searchStays({
          city,
          countryCode,
          checkin,
          checkout,
          adults,
          childAges,
          rooms,
          limit: 24,
          signal: controller.signal,
        })
      : listCityHotels({
          city,
          countryCode,
          limit: 24,
          signal: controller.signal,
        }).then((list) => ({
          hotels: list,
          priced: false,
          warning: "Add check-in and check-out dates to see live rates.",
        }));

    request.then(
      (result) => {
        setHotels(result.hotels);
        setPriced(result.priced);
        setMessage(result.warning || "");
        setStatus("ready");
        setLoadedKey(searchKey);
      },
      (error: unknown) => {
        if (isAbortError(error)) return;
        setHotels([]);
        setPriced(false);
        setMessage(errorMessage(error));
        setStatus("error");
        setLoadedKey(searchKey);
      },
    );

    return () => controller.abort();
  }, [
    adults,
    ages,
    attempt,
    checkin,
    checkout,
    city,
    countryCode,
    rooms,
    searchKey,
  ]);

  const visible = applyFilters(hotels, filters);
  const nights = nightsBetween(stay.checkin, stay.checkout);

  const pending = loadedKey !== searchKey;
  const highlighted = activeId ?? (focus || null);

  useEffect(() => {
    if (pending || !focus) return;
    document
      .getElementById(`stay-${focus}`)
      ?.scrollIntoView({ block: "center" });
  }, [focus, pending]);

  const mapHotels: MapHotel[] = visible.flatMap((hotel) => {
    if (!isCoordinate(hotel.latitude) || !isCoordinate(hotel.longitude))
      return [];
    return [
      {
        id: hotel.id,
        name: hotel.name,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        priceLabel:
          hotel.price != null
            ? formatMoney(hotel.price, hotel.currency || "USD")
            : "Stay",
      },
    ];
  });

  const center =
    stay.latitude != null && stay.longitude != null
      ? { lat: stay.latitude, lng: stay.longitude }
      : undefined;

  function selectHotel(id: string) {
    setActiveId(id);
    setMapOpen(false);
    document.getElementById(`stay-${id}`)?.scrollIntoView({ block: "center" });
  }

  return (
    <div className="bg-paper pt-16">
      <div className="sticky top-16 z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-4">
          <SearchBar
            key={searchKey}
            tone="plain"
            initial={{
              location: stay.city,
              checkin: stay.checkin,
              checkout: stay.checkout,
              adults: stay.adults,
              children: stay.children,
              childAges: stay.childAges,
              rooms: stay.rooms,
            }}
          />
          <StayFilters value={filters} onChange={updateParams} />
        </div>
      </div>

      <div className="mx-auto flex max-w-[1440px] gap-4 px-4 py-4">
        <section
          className="min-w-0 flex-1"
          aria-label={`Hotels in ${stay.city}`}
        >
          <div className="mb-4 flex items-end justify-between gap-3 px-1">
            <div>
              <h1 className="font-display text-4xl tracking-tight">
                {stay.city}
                {stay.country ? (
                  <span className="text-neutral-500">, {stay.country}</span>
                ) : null}
              </h1>
              <p className="mt-1 text-sm text-neutral-500" aria-live="polite">
                {pending
                  ? "Looking up stays"
                  : `${visible.length} stay${visible.length === 1 ? "" : "s"}${priced ? "" : " listed"}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMapOpen(true)}
              className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white lg:hidden"
            >
              Map
            </button>
          </div>

          {message ? (
            <p
              className="mb-4 rounded-2xl bg-sand px-4 py-3 text-sm text-ink"
              role="status"
            >
              {message}
            </p>
          ) : null}

          {pending ? (
            <div className="space-y-4" aria-hidden>
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="h-44 animate-pulse rounded-3xl bg-white"
                />
              ))}
            </div>
          ) : null}

          {!pending && status === "error" ? (
            <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-ink/5">
              <p className="font-display text-3xl">
                The search did not go through.
              </p>
              <button
                type="button"
                onClick={() => setAttempt((value) => value + 1)}
                className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white"
              >
                Try again
              </button>
            </div>
          ) : null}

          {!pending && status === "ready" && visible.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-ink/5">
              <p className="font-display text-3xl">
                Nothing matches this search.
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                Clear a filter or try different dates for {stay.city}.
              </p>
            </div>
          ) : null}

          <div className="space-y-4">
            {!pending && status === "ready"
              ? visible.map((hotel) => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    nights={nights}
                    active={highlighted === hotel.id}
                    onHover={setActiveId}
                    href={buildHotelHref({ ...stay, hotelId: hotel.id })}
                  />
                ))
              : null}
          </div>
        </section>

        <aside className="sticky top-44 hidden h-[calc(100vh-12.5rem)] w-[44%] shrink-0 lg:block">
          {desktop ? (
            <HotelMap
              hotels={mapHotels}
              center={center}
              activeId={highlighted}
              onHover={setActiveId}
              onSelect={selectHotel}
            />
          ) : (
            <div className="h-full rounded-3xl bg-sand" />
          )}
        </aside>
      </div>

      {mapOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 bg-paper p-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMapOpen(false)}
            className="absolute right-6 top-6 z-10 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow"
          >
            List
          </button>
          <HotelMap
            hotels={mapHotels}
            center={center}
            activeId={highlighted}
            onHover={setActiveId}
            onSelect={selectHotel}
          />
        </div>
      ) : null}
    </div>
  );
}

function applyFilters(
  hotels: StayHotel[],
  filters: {
    sort: string;
    stars: string;
    score: string;
    refundable: boolean;
    maxPrice: string;
    query: string;
  },
) {
  const query = filters.query.trim().toLowerCase();
  const max = Number(filters.maxPrice);
  const minStars = Number(filters.stars) || 0;
  const minScore = Number(filters.score) || 0;
  const filtered = hotels.filter((hotel) => {
    if (query && !hotel.name.toLowerCase().includes(query)) return false;
    if (minStars && (hotel.stars ?? 0) < minStars) return false;
    if (minScore && (scoreOutOfTen(hotel.rating) ?? 0) < minScore) return false;
    if (filters.refundable && hotel.refundable !== true) return false;
    if (
      filters.maxPrice &&
      Number.isFinite(max) &&
      (hotel.price ?? Number.POSITIVE_INFINITY) > max
    ) {
      return false;
    }
    return true;
  });

  return filtered.sort((a, b) => {
    if (filters.sort === "price-asc") {
      return (
        (a.price ?? Number.POSITIVE_INFINITY) -
        (b.price ?? Number.POSITIVE_INFINITY)
      );
    }
    if (filters.sort === "price-desc") return (b.price ?? -1) - (a.price ?? -1);
    if (filters.sort === "rating") {
      return (scoreOutOfTen(b.rating) ?? 0) - (scoreOutOfTen(a.rating) ?? 0);
    }
    const byScore =
      (scoreOutOfTen(b.rating) ?? 0) - (scoreOutOfTen(a.rating) ?? 0);
    if (byScore !== 0) return byScore;
    return (
      (a.price ?? Number.POSITIVE_INFINITY) -
      (b.price ?? Number.POSITIVE_INFINITY)
    );
  });
}

function isCoordinate(value?: number): value is number {
  return value != null && Number.isFinite(value);
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}
