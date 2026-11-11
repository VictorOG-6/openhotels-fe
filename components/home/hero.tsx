import SearchBar from "@/components/search/search-bar";
import StayLink from "@/components/hotels/stay-link";
import { LOCATIONS } from "@/lib/hotels/locations";

const INITIAL = {
  location: "",
  checkin: "",
  checkout: "",
  adults: 2,
  children: 0,
  childAges: [] as number[],
  rooms: 1,
};

export default function Hero() {
  return (
    <section className="relative min-h-[100svh]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2400&q=80"
        alt=""
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(26_23_20_/_55%),rgb(26_23_20_/_18%)_42%,rgb(26_23_20_/_62%))]" />
      <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-4 pb-16 pt-24 text-center text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">Open Hotels</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight tracking-tight md:text-7xl">
          Find a hotel with a live rate.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-white/85 md:text-lg">
          Choose a city, your dates, and how many guests. Then compare rooms beside the map.
        </p>
        <div className="mt-8 w-full max-w-5xl">
          <SearchBar initial={INITIAL} tone="overlay" />
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {LOCATIONS.slice(0, 5).map((location) => (
            <StayLink
              key={location.slug}
              location={location}
              className="rounded-full bg-white/15 px-3 py-1.5 text-sm text-white ring-1 ring-white/30 hover:bg-white/25"
            >
              {location.city}
            </StayLink>
          ))}
        </div>
      </div>
    </section>
  );
}
