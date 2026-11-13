import Link from "next/link";

import StayLink from "@/components/hotels/stay-link";
import { LOCATIONS } from "@/lib/hotels/locations";

export default function Destinations() {
  return (
    <section
      id="destinations"
      className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">
            Places
          </p>
          <h2 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
            Start with a city.
          </h2>
        </div>
        <Link href="/hotels" className="text-sm font-semibold text-clay">
          All hotels
        </Link>
      </div>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LOCATIONS.slice(0, 8).map((location) => (
          <li key={location.slug}>
            <StayLink location={location} className="group block">
              <div className="relative h-56 overflow-hidden rounded-3xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={location.image}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="mt-3 font-display text-2xl">{location.city}</h3>
              <p className="text-sm text-neutral-500">{location.country}</p>
            </StayLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
