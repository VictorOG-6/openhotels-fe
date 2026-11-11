import type { Metadata } from "next";
import { Suspense } from "react";

import HotelDetailView from "@/components/hotels/hotel-detail";
import { DetailSkeleton } from "@/components/hotels/skeletons";

export const metadata: Metadata = {
  title: "Hotel",
  description: "Hotel details, available rooms, and a rate you can prebook.",
};

export default function HotelPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <HotelDetailView />
    </Suspense>
  );
}
