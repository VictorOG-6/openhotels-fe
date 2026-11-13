"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { guestLabel } from "@/lib/hotels/format";
import { LOCATIONS } from "@/lib/hotels/locations";
import { buildBrowseHref, resolveDestination } from "@/lib/hotels/query";
import type { StaySelection } from "@/lib/hotels/types";
import { cn } from "@/lib/utils";

type SearchDraft = {
  location: string;
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  childAges: number[];
  rooms: number;
};

type SearchBarProps = {
  initial: SearchDraft;
  destination?: StaySelection;
  hideLocation?: boolean;
  tone?: "overlay" | "plain";
  submitLabel?: string;
  onSubmit?: (stay: StaySelection) => void;
};

const EMPTY_DESTINATION: StaySelection = {
  slug: "",
  city: "",
  country: "",
  checkin: "",
  checkout: "",
  adults: 2,
  children: 0,
  childAges: [],
  rooms: 1,
};

export default function SearchBar({
  initial,
  destination,
  hideLocation = false,
  tone = "plain",
  submitLabel = "Search",
  onSubmit,
}: SearchBarProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const listId = useId();
  const [location, setLocation] = useState(initial.location);
  const [checkin, setCheckin] = useState(initial.checkin);
  const [checkout, setCheckout] = useState(initial.checkout);
  const [adults, setAdults] = useState(initial.adults);
  const [children, setChildren] = useState(initial.children);
  const [childAges, setChildAges] = useState(initial.childAges);
  const [rooms, setRooms] = useState(initial.rooms);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!suggestOpen && !guestOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!formRef.current?.contains(event.target as Node)) {
        setSuggestOpen(false);
        setGuestOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSuggestOpen(false);
        setGuestOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [guestOpen, suggestOpen]);

  const query = location.trim().toLowerCase();
  const matches = LOCATIONS.filter((item) => {
    if (!query) return true;
    return (
      item.city.toLowerCase().includes(query) ||
      item.country.toLowerCase().includes(query)
    );
  }).slice(0, 6);
  const exactMatch = LOCATIONS.some(
    (item) => item.city.toLowerCase() === query,
  );

  function setChildCount(count: number) {
    setChildren(count);
    setChildAges((current) => {
      const next = current.slice(0, count);
      while (next.length < count) next.push(8);
      return next;
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const resolved = hideLocation
      ? {
          ...(destination ?? EMPTY_DESTINATION),
          city: destination?.city || location,
        }
      : resolveDestination(location);

    if (!resolved?.slug || !resolved.city) {
      setError("Enter a city to search.");
      return;
    }
    if (!checkin || !checkout || checkout <= checkin) {
      setError("Check-out has to be after check-in.");
      return;
    }

    const stay: StaySelection = {
      ...resolved,
      checkin,
      checkout,
      adults,
      children,
      childAges,
      rooms,
    };
    setError("");
    setGuestOpen(false);
    setSuggestOpen(false);
    if (onSubmit) onSubmit(stay);
    else router.push(buildBrowseHref(stay));
  }

  return (
    <form ref={formRef} onSubmit={submit} className="w-full max-w-5xl">
      <div className="grid grid-cols-1 rounded-[28px] bg-white text-ink shadow-[0_24px_70px_rgb(26_23_20_/_22%)] md:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1fr)_auto] md:items-center md:rounded-full">
        {hideLocation ? null : (
          <label className="relative flex flex-col justify-center px-5 py-3 md:px-6">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Where
            </span>
            <input
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                setSuggestOpen(true);
              }}
              onFocus={() => {
                setSuggestOpen(true);
                setGuestOpen(false);
              }}
              placeholder="City or destination"
              aria-label="Destination"
              role="combobox"
              aria-expanded={suggestOpen}
              aria-controls={listId}
              aria-autocomplete="list"
              autoComplete="off"
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-ink/35"
            />
            {suggestOpen ? (
              <ul
                id={listId}
                className="absolute left-0 top-[calc(100%+10px)] z-40 max-h-80 w-[min(100%,20rem)] overflow-auto rounded-3xl bg-white p-2 text-left shadow-2xl ring-1 ring-ink/10"
              >
                {matches.map((item) => (
                  <li key={item.slug}>
                    <button
                      type="button"
                      onClick={() => {
                        setLocation(item.city);
                        setSuggestOpen(false);
                      }}
                      className="flex w-full flex-col rounded-2xl px-3 py-2 text-left hover:bg-sand"
                    >
                      <span className="font-medium">{item.city}</span>
                      <span className="text-xs text-neutral-500">
                        {item.country}
                      </span>
                    </button>
                  </li>
                ))}
                {query && !exactMatch ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => setSuggestOpen(false)}
                      className="w-full rounded-2xl px-3 py-2 text-left text-sm hover:bg-sand"
                    >
                      Search for “{location.trim()}”
                    </button>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </label>
        )}

        <label
          className={cn(
            "flex flex-col justify-center border-t border-line px-5 py-3 md:border-t-0 md:border-l md:px-6",
            hideLocation && "md:border-l-0",
          )}
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Check in
          </span>
          <input
            type="date"
            value={checkin}
            required
            aria-label="Check in"
            onFocus={(event) => {
              event.currentTarget.min = todayString();
              setSuggestOpen(false);
              setGuestOpen(false);
            }}
            onChange={(event) => {
              const next = event.target.value;
              setCheckin(next);
              if (checkout && next && checkout <= next) setCheckout("");
            }}
            className="bg-transparent text-sm font-medium outline-none"
          />
        </label>

        <label className="flex flex-col justify-center border-t border-line px-5 py-3 md:border-t-0 md:border-l md:px-6">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Check out
          </span>
          <input
            type="date"
            value={checkout}
            required
            aria-label="Check out"
            onChange={(event) => setCheckout(event.target.value)}
            onFocus={(event) => {
              const today = todayString();
              event.currentTarget.min =
                checkin && checkin > today ? checkin : today;
              setSuggestOpen(false);
              setGuestOpen(false);
            }}
            className="bg-transparent text-sm font-medium outline-none"
          />
        </label>

        <div className="relative border-t border-line md:border-t-0 md:border-l">
          <button
            type="button"
            aria-expanded={guestOpen}
            aria-haspopup="dialog"
            onClick={() => {
              setGuestOpen((open) => !open);
              setSuggestOpen(false);
            }}
            className="flex w-full flex-col justify-center px-5 py-3 text-left md:px-6"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Guests
            </span>
            <span className="truncate text-sm font-medium">
              {guestLabel(adults, children, rooms)}
            </span>
          </button>
          {guestOpen ? (
            <div
              role="dialog"
              aria-label="Guests and rooms"
              className="absolute right-0 top-[calc(100%+10px)] z-40 w-[min(100vw-2rem,22rem)] rounded-3xl bg-white p-4 text-left shadow-2xl ring-1 ring-ink/10"
            >
              <Stepper
                label="Adults"
                hint="Ages 18+"
                value={adults}
                min={1}
                max={10}
                onChange={setAdults}
              />
              <Stepper
                label="Children"
                hint="Ages 0–17"
                value={children}
                min={0}
                max={8}
                onChange={setChildCount}
              />
              <Stepper
                label="Rooms"
                value={rooms}
                min={1}
                max={8}
                onChange={setRooms}
              />
              {children > 0 ? (
                <div className="mt-3 border-t border-line pt-3">
                  <p className="text-xs text-neutral-500">
                    Child ages are sent with the rate request.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {childAges.map((age, index) => (
                      <label
                        key={index}
                        className="text-xs font-medium text-neutral-500"
                      >
                        Child {index + 1}
                        <select
                          value={age}
                          aria-label={`Age of child ${index + 1}`}
                          onChange={(event) => {
                            const next = [...childAges];
                            next[index] = Number(event.target.value);
                            setChildAges(next);
                          }}
                          className="mt-1 w-full rounded-xl border border-line bg-paper px-2 py-2 text-sm text-ink"
                        >
                          {Array.from({ length: 18 }, (_, ageOption) => (
                            <option key={ageOption} value={ageOption}>
                              {ageOption}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setGuestOpen(false)}
                className="mt-4 w-full rounded-full bg-ink py-2 text-sm font-semibold text-white"
              >
                Done
              </button>
            </div>
          ) : null}
        </div>

        <div className="p-2">
          <button
            type="submit"
            className="h-12 w-full rounded-full bg-clay px-6 text-sm font-semibold text-white transition hover:bg-clay-dark md:w-auto"
          >
            {submitLabel}
          </button>
        </div>
      </div>
      {error ? (
        <p
          role="alert"
          className={cn(
            "mt-3 text-center text-sm",
            tone === "overlay" ? "text-white" : "text-clay",
          )}
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint ? (
          <span className="block text-xs text-neutral-500">{hint}</span>
        ) : null}
      </span>
      <span className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="grid h-8 w-8 place-items-center rounded-full border border-line disabled:opacity-30"
        >
          −
        </button>
        <span className="w-5 text-center text-sm font-semibold">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="grid h-8 w-8 place-items-center rounded-full border border-line disabled:opacity-30"
        >
          +
        </button>
      </span>
    </div>
  );
}

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
