import type { Metadata } from "next";
import { Suspense } from "react";

import BookingFlow from "@/components/booking/booking-flow";

export const metadata: Metadata = {
  title: "Booking",
  description: "Review a pre-booking, then confirm guest and payment details.",
};

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="px-5 pt-28 text-sm text-muted">Opening booking</div>}>
      <BookingFlow />
    </Suspense>
  );
}
