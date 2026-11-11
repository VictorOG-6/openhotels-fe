import type { Metadata } from "next";
import { Suspense } from "react";

import HotelBrowse from "@/components/hotels/hotel-browse";
import { BrowseSkeleton } from "@/components/hotels/skeletons";
import { LOCATIONS } from "@/lib/hotels/locations";

export const metadata: Metadata = {
  title: "Browse hotels",
  description: "Filter hotel stays and compare them on a live map.",
};

export function generateStaticParams() {
  return LOCATIONS.map((location) => ({ location: location.slug }));
}

export default function LocationHotelsPage() {
  return (
    <Suspense fallback={<BrowseSkeleton />}>
      <HotelBrowse />
    </Suspense>
  );
}
