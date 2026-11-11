"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type StayFilterValue = {
  sort: string;
  stars: string;
  score: string;
  refundable: boolean;
  maxPrice: string;
  query: string;
};

export default function StayFilters({
  value,
  onChange,
}: {
  value: StayFilterValue;
  onChange: (changes: Record<string, string | null>) => void;
}) {
  const [query, setQuery] = useState(value.query);
  const [maxPrice, setMaxPrice] = useState(value.maxPrice);
  const [syncedQuery, setSyncedQuery] = useState(value.query);
  const [syncedMax, setSyncedMax] = useState(value.maxPrice);

  if (value.query !== syncedQuery) {
    setSyncedQuery(value.query);
    setQuery(value.query);
  }
  if (value.maxPrice !== syncedMax) {
    setSyncedMax(value.maxPrice);
    setMaxPrice(value.maxPrice);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query.trim() !== value.query) onChange({ q: query.trim() || null });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [onChange, query, value.query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (maxPrice !== value.maxPrice) onChange({ max: maxPrice.trim() || null });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [maxPrice, onChange, value.maxPrice]);

  const active = Boolean(
    value.stars || value.score || value.refundable || value.maxPrice || value.query || value.sort !== "recommended",
  );

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <label className="sr-only" htmlFor="stay-sort">Sort stays</label>
      <select
        id="stay-sort"
        value={value.sort}
        onChange={(event) => onChange({ sort: event.target.value === "recommended" ? null : event.target.value })}
        className="h-10 rounded-full border border-line bg-white px-3 text-sm"
      >
        <option value="recommended">Recommended</option>
        <option value="price-asc">Price, low to high</option>
        <option value="price-desc">Price, high to low</option>
        <option value="rating">Guest score</option>
      </select>
      <FilterButton active={value.stars === "4"} onClick={() => onChange({ stars: value.stars === "4" ? null : "4" })}>
        4+ stars
      </FilterButton>
      <FilterButton active={value.stars === "5"} onClick={() => onChange({ stars: value.stars === "5" ? null : "5" })}>
        5 stars
      </FilterButton>
      <FilterButton active={value.score === "8"} onClick={() => onChange({ score: value.score === "8" ? null : "8" })}>
        Score 8+
      </FilterButton>
      <FilterButton
        active={value.refundable}
        onClick={() => onChange({ refundable: value.refundable ? null : "1" })}
      >
        Refundable
      </FilterButton>
      <label className="flex h-10 items-center gap-2 rounded-full border border-line bg-white px-3 text-sm">
        Max
        <input
          inputMode="numeric"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value.replace(/[^\d]/g, ""))}
          placeholder="Any"
          aria-label="Maximum total price"
          className="w-16 bg-transparent outline-none placeholder:text-muted"
        />
      </label>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Hotel name"
        aria-label="Filter by hotel name"
        className="h-10 w-40 rounded-full border border-line bg-white px-3 text-sm outline-none"
      />
      {active ? (
        <button
          type="button"
          onClick={() => onChange({ sort: null, stars: null, score: null, refundable: null, max: null, q: null })}
          className="h-10 rounded-full px-3 text-sm font-medium text-clay"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-10 rounded-full border px-3 text-sm",
        active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink",
      )}
    >
      {children}
    </button>
  );
}
