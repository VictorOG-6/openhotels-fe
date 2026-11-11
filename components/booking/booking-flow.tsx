"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  errorMessage,
  fetchBook,
  fetchBooking,
  fetchPrebook,
  isAbortError,
  type BookPayload,
} from "@/lib/hotels/api";
import { cleanPhone, formatMoney, formatStayDate, guestLabel } from "@/lib/hotels/format";
import { readBooking, readPrebook } from "@/lib/hotels/parse";
import { buildHotelHref, readStay } from "@/lib/hotels/query";
import type { BookingResult, PrebookResult } from "@/lib/hotels/types";

const PAYMENT_METHODS = [
  { value: "ACC_CREDIT_CARD", label: "Account card" },
  { value: "WALLET", label: "Wallet" },
  { value: "CREDIT", label: "Credit line" },
] as const;

export default function BookingFlow() {
  const searchParams = useSearchParams();
  const offerId = searchParams.get("offerId")?.trim() || "";

  if (!offerId) return <BookingLookup />;
  return <Checkout key={offerId} offerId={offerId} />;
}

function Checkout({ offerId }: { offerId: string }) {
  const searchParams = useSearchParams();
  const slug = searchParams.get("location") || "";
  const hotelId = searchParams.get("hotelId") || "";
  const stay = readStay(searchParams, slug || "stay");
  const quotedHotel = searchParams.get("hotel") || stay.city;
  const quotedRoom = searchParams.get("room") || "Selected room";

  const [prebook, setPrebook] = useState<PrebookResult | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error" | "booked">("loading");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [sameGuest, setSameGuest] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetchPrebook(offerId, controller.signal)
      .then((payload) => {
        const result = readPrebook(payload);
        if (!result) throw new Error("The rate did not return a prebook id.");
        setPrebook(result);
        setPhase("ready");
      })
      .catch((reason: unknown) => {
        if (isAbortError(reason)) return;
        setPhase("error");
        setError(errorMessage(reason));
      });
    return () => controller.abort();
  }, [offerId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prebook) return;
    const form = new FormData(event.currentTarget);
    const holder = {
      firstName: text(form, "firstName"),
      lastName: text(form, "lastName"),
      email: text(form, "email"),
      phone: cleanPhone(text(form, "phone")),
    };
    const guest = sameGuest
      ? {
          occupancyNumber: 1,
          firstName: holder.firstName,
          lastName: holder.lastName,
          email: holder.email,
        }
      : {
          occupancyNumber: 1,
          firstName: text(form, "guestFirstName"),
          lastName: text(form, "guestLastName"),
          email: text(form, "guestEmail"),
        };
    const method = text(form, "payment") as BookPayload["payment"]["method"];

    if (holder.phone.length < 5) {
      setError("Enter a phone number with at least 5 digits.");
      return;
    }

    const payload: BookPayload = {
      prebookId: prebook.prebookId,
      holder,
      guests: [guest],
      payment: { method },
    };

    setSubmitting(true);
    setError("");
    try {
      const response = await fetchBook(payload);
      const result = readBooking(response);
      if (!result) throw new Error("The booking did not return a confirmation id.");
      setBooking(result);
      setPhase("booked");
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  }

  const backHref =
    slug && hotelId
      ? buildHotelHref({ ...stay, slug, hotelId, city: stay.city || quotedHotel })
      : "/hotels";

  if (phase === "booked" && booking) {
    return (
      <section className="mx-auto max-w-2xl px-5 pb-20 pt-28">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Confirmed</p>
        <h1 className="mt-2 font-display text-5xl tracking-tight">Your stay is booked.</h1>
        <dl className="mt-8 space-y-3 rounded-3xl bg-white p-6 ring-1 ring-ink/8">
          <Row label="Booking" value={booking.bookingId} />
          <Row label="Status" value={booking.status || "Submitted"} />
          <Row label="Hotel" value={booking.hotelName || quotedHotel} />
          {booking.confirmationCode ? <Row label="Hotel confirmation" value={booking.confirmationCode} /> : null}
          {booking.price != null ? (
            <Row label="Total" value={formatMoney(booking.price, booking.currency || prebook?.currency || "USD")} />
          ) : null}
        </dl>
        <Link href="/hotels" className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white">
          Browse more hotels
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-5 pb-20 pt-28 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Booking</p>
        <h1 className="mt-2 font-display text-5xl tracking-tight">Confirm the stay</h1>
        <ol className="mt-4 flex gap-3 text-sm text-muted">
          <li className={phase === "loading" ? "font-semibold text-ink" : ""}>1. Prebook</li>
          <li className={phase === "ready" ? "font-semibold text-ink" : ""}>2. Guests</li>
          <li>3. Confirmation</li>
        </ol>

        {phase === "loading" ? (
          <p className="mt-8 text-sm text-muted">Reserving {quotedRoom} so the rate can be confirmed.</p>
        ) : null}
        {phase === "error" ? (
          <div className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-ink/8" role="alert">
            <p className="font-display text-3xl">This rate could not be prebooked.</p>
            <p className="mt-2 text-sm text-muted">{error}</p>
            <Link href={backHref} className="mt-4 inline-flex text-sm font-semibold text-clay">
              Choose another room
            </Link>
          </div>
        ) : null}

        {phase === "ready" && prebook ? (
          <form onSubmit={submit} className="mt-8 space-y-6">
            <fieldset className="grid gap-4 rounded-3xl bg-white p-5 ring-1 ring-ink/8 sm:grid-cols-2">
              <legend className="px-1 text-sm font-semibold">Booker</legend>
              <Field label="First name" name="firstName" autoComplete="given-name" />
              <Field label="Last name" name="lastName" autoComplete="family-name" />
              <Field label="Email" name="email" type="email" autoComplete="email" />
              <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
            </fieldset>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={sameGuest}
                onChange={(event) => setSameGuest(event.target.checked)}
              />
              Lead guest is the booker
            </label>

            {sameGuest ? null : (
              <fieldset className="grid gap-4 rounded-3xl bg-white p-5 ring-1 ring-ink/8 sm:grid-cols-2">
                <legend className="px-1 text-sm font-semibold">Lead guest</legend>
                <Field label="First name" name="guestFirstName" autoComplete="given-name" />
                <Field label="Last name" name="guestLastName" autoComplete="family-name" />
                <Field label="Email" name="guestEmail" type="email" autoComplete="email" className="sm:col-span-2" />
              </fieldset>
            )}

            <fieldset className="rounded-3xl bg-white p-5 ring-1 ring-ink/8">
              <legend className="px-1 text-sm font-semibold">Payment method</legend>
              <p className="mb-3 text-sm text-muted">
                The stay is charged with the partner account method. Card numbers are not collected here.
              </p>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <label key={method.value} className="flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm">
                    <input type="radio" name="payment" value={method.value} defaultChecked={method.value === "ACC_CREDIT_CARD"} />
                    {method.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {error ? (
              <p role="alert" className="text-sm text-clay">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-clay px-6 py-3 text-sm font-semibold text-white hover:bg-clay-dark disabled:opacity-60"
            >
              {submitting ? "Booking" : "Book this stay"}
            </button>
          </form>
        ) : null}
      </div>

      <aside className="h-fit rounded-3xl bg-white p-6 ring-1 ring-ink/8 lg:sticky lg:top-24">
        <p className="text-sm text-muted">{prebook?.hotelName || quotedHotel}</p>
        <h2 className="mt-1 font-display text-3xl">{prebook?.roomName || quotedRoom}</h2>
        <p className="mt-3 text-sm text-muted">
          {stay.checkin && stay.checkout
            ? `${formatStayDate(stay.checkin)} – ${formatStayDate(stay.checkout)}`
            : "Dates from your search"}
        </p>
        <p className="mt-1 text-sm text-muted">{guestLabel(stay.adults, stay.children, stay.rooms)}</p>
        {prebook?.boardName ? <p className="mt-3 text-sm">{prebook.boardName}</p> : null}
        {prebook?.cancellation ? <p className="mt-2 text-sm text-pine">{prebook.cancellation}</p> : null}
        <p className="mt-5 text-2xl font-semibold">
          {prebook?.price != null
            ? formatMoney(prebook.price, prebook.currency || "USD")
            : "Confirming price"}
        </p>
        {prebook && prebook.priceDifferencePercent ? (
          <p className="mt-2 text-sm text-clay">
            The confirmed price moved {prebook.priceDifferencePercent}% from the quoted rate.
          </p>
        ) : null}
        {prebook?.cancellationChanged ? (
          <p className="mt-2 text-sm text-clay">The cancellation policy changed at prebook.</p>
        ) : null}
        {prebook?.boardChanged ? (
          <p className="mt-2 text-sm text-clay">The board type changed at prebook.</p>
        ) : null}
        {prebook ? <p className="mt-4 text-xs text-muted">Prebook {prebook.prebookId}</p> : null}
        {prebook?.terms ? (
          <details className="mt-4 text-sm text-muted">
            <summary className="cursor-pointer font-medium text-ink">Terms</summary>
            <p className="mt-2 whitespace-pre-line leading-6">{prebook.terms}</p>
          </details>
        ) : null}
      </aside>
    </section>
  );
}

function BookingLookup() {
  const [bookingId, setBookingId] = useState("");
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = bookingId.trim();
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
      setError("Enter the booking id from your confirmation.");
      setBooking(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = readBooking(await fetchBooking(id));
      if (!result) throw new Error("No booking was returned.");
      setBooking(result);
    } catch (reason) {
      setBooking(null);
      setError(errorMessage(reason));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl px-5 pb-20 pt-28">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Booking</p>
      <h1 className="mt-2 font-display text-5xl tracking-tight">Bookings start with a room.</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Choose a hotel, prebook a rate, then confirm the guest details. If you already have a booking id, look it up here.
      </p>
      <Link href="/hotels" className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white">
        Find a hotel
      </Link>
      <form onSubmit={submit} className="mt-10 rounded-3xl bg-white p-5 ring-1 ring-ink/8">
        <label className="block text-sm font-medium" htmlFor="booking-id">Booking id</label>
        <input
          id="booking-id"
          value={bookingId}
          onChange={(event) => setBookingId(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-line px-3 py-3 outline-none"
        />
        {error ? <p className="mt-3 text-sm text-clay" role="alert">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Looking up" : "Look up booking"}
        </button>
        {booking ? (
          <dl className="mt-5 space-y-2 border-t border-line pt-4">
            <Row label="Booking" value={booking.bookingId} />
            <Row label="Status" value={booking.status || "Unknown"} />
            <Row label="Hotel" value={booking.hotelName || "Hotel"} />
            {booking.checkin && booking.checkout ? (
              <Row label="Stay" value={`${formatStayDate(booking.checkin)} – ${formatStayDate(booking.checkout)}`} />
            ) : null}
          </dl>
        ) : null}
      </form>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium ${className}`}>
      {label}
      <input
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        maxLength={type === "email" ? 120 : 80}
        className="mt-1 w-full rounded-2xl border border-line px-3 py-3 font-normal outline-none"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function text(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}
