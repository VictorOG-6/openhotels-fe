import Link from "next/link";

import { LOCATIONS } from "@/lib/hotels/locations";
import { getCopyrightYear } from "@/lib/copyright-year";

export default async function Footer() {
  const year = await getCopyrightYear();

  return (
    <footer className="border-t border-line bg-pine text-sand">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          <p className="font-display text-3xl text-white">Open Hotels</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-neutral-500">
            Search a city, compare live room rates on a map, and confirm the stay
            only after the rate is prebooked.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Explore</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="cursor-pointer hover:text-white" href="/hotels">All hotels</Link></li>
            {LOCATIONS.slice(0, 4).map((location) => (
              <li key={location.slug}>
                <Link className="cursor-pointer hover:text-white" href={`/hotels/${location.slug}`}>
                  {location.city}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Visit</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="cursor-pointer hover:text-white" href="/bookings">Bookings</Link></li>
            <li><Link className="cursor-pointer hover:text-white" href="/about">About</Link></li>
            <li><Link className="cursor-pointer hover:text-white" href="/contact">Contact</Link></li>
            <li><Link className="cursor-pointer hover:text-white" href="/#how-it-works">How booking works</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 text-xs text-neutral-500 md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {year} Open Hotels. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              className="cursor-pointer text-sand underline underline-offset-2 hover:text-white"
              href="/terms-of-service"
            >
              Terms of Service
            </Link>
            <Link
              className="cursor-pointer text-sand underline underline-offset-2 hover:text-white"
              href="/privacy-policy"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
        <p className="mx-auto max-w-6xl border-t border-white/10 px-5 py-4 text-xs text-neutral-500 md:px-8">
          Rates and availability come from the hotel partner at the moment you search.
        </p>
      </div>
    </footer>
  );
}
