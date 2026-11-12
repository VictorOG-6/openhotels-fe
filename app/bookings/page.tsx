import type { Metadata } from "next";
import { Suspense } from "react";

import BookingFlow from "@/components/booking/booking-flow";

export const metadata: Metadata = {
  title: "Bookings",
  description: "Review pre-bookings and confirmed stays, then complete payment on a hold.",
};

export default function BookingsPage() {
  return (
    <Suspense fallback={<div className="px-5 pt-28 text-sm text-muted">Opening bookings</div>}>
      <BookingFlow />
    </Suspense>
  );
}
