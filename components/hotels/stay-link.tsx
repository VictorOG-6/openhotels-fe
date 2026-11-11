"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { buildBrowseHref, defaultStay } from "@/lib/hotels/query";

type StayLinkLocation = {
  slug: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
};

export default function StayLink({
  location,
  focus,
  className,
  children,
}: {
  location: StayLinkLocation;
  focus?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <Link
      href={`/hotels/${location.slug}`}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        const dates = defaultStay();
        router.push(
          buildBrowseHref({
            slug: location.slug,
            city: location.city,
            country: location.country,
            countryCode: location.countryCode,
            latitude: location.latitude,
            longitude: location.longitude,
            ...dates,
            adults: 2,
            children: 0,
            childAges: [],
            rooms: 1,
            focus,
          }),
        );
      }}
    >
      {children}
    </Link>
  );
}
