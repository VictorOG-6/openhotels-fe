import Link from "next/link";

import { LOCATIONS } from "@/lib/hotels/locations";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-pine text-sand">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          <p className="font-display text-3xl text-white">Open Hotels</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-sand/80">
            Search a city, compare live room rates on a map, and confirm the stay
            only after the rate is prebooked.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Explore</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/hotels">All hotels</Link></li>
            {LOCATIONS.slice(0, 4).map((location) => (
              <li key={location.slug}>
                <Link className="hover:text-white" href={`/hotels/${location.slug}`}>
                  {location.city}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Visit</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/bookings">Bookings</Link></li>
            <li><Link className="hover:text-white" href="/about">About</Link></li>
            <li><Link className="hover:text-white" href="/contact">Contact</Link></li>
            <li><Link className="hover:text-white" href="/#how-it-works">How booking works</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-sand/70 md:px-8">
          Rates and availability come from the hotel partner at the moment you search.
        </p>
      </div>
    </footer>
  );
}
