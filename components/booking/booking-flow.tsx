"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { readAssistantContext, readGuestDefaults } from "@/lib/assistant/context";
import {
  errorMessage,
  fetchBook,
  fetchPrebook,
  isAbortError,
  type BookPayload,
} from "@/lib/hotels/api";
import { cleanPhone, formatMoney, formatStayDate, guestLabel } from "@/lib/hotels/format";
import { readBooking, readPrebook } from "@/lib/hotels/parse";
import { findPrebook, isPrebookId, markPrebookBooked, rememberPrebook } from "@/lib/hotels/prebook-store";
import { buildHotelHref, readStay } from "@/lib/hotels/query";
import type { BookingResult, PrebookResult } from "@/lib/hotels/types";
import BookingsList from "@/components/booking/bookings-list";

const PAYMENT_METHODS = [
  { value: "ACC_CREDIT_CARD", label: "Account card" },
  { value: "WALLET", label: "Wallet" },
  { value: "CREDIT", label: "Credit line" },
] as const;

export default function BookingFlow() {
  const searchParams = useSearchParams();
  const offerId = searchParams.get("offerId")?.trim() || "";
  const prebookId = searchParams.get("prebookId")?.trim() || "";

  if (prebookId) return <Checkout key={prebookId} existingPrebookId={prebookId} />;
  if (offerId) return <Checkout key={offerId} offerId={offerId} />;
  return <BookingsList />;
}

function Checkout({
  offerId,
  existingPrebookId,
}: {
  offerId?: string;
  existingPrebookId?: string;
}) {
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
  const [guest, setGuest] = useState({ firstName: "", lastName: "", email: "" });
  const [signedIn, setSignedIn] = useState(false);
  const [savedStay, setSavedStay] = useState({ checkin: "", checkout: "" });

  useEffect(() => {
    const defaults = readGuestDefaults();
    setGuest(defaults);
    setSignedIn(readSignedIn());
  }, []);

  useEffect(() => {
    if (existingPrebookId) {
      if (!isPrebookId(existingPrebookId)) {
        setPhase("error");
        setError("That pre-booking id is not valid.");
        return;
      }
      const saved = findPrebook(existingPrebookId);
      setSavedStay({
        checkin: saved?.checkin || "",
        checkout: saved?.checkout || "",
      });
      setPrebook({
        prebookId: existingPrebookId,
        price: saved?.price,
        currency: saved?.currency,
        hotelName: saved?.hotelName,
        roomName: saved?.roomName,
        cancellationChanged: false,
        boardChanged: false,
      });
      setPhase("ready");
      return;
    }

    if (!offerId) return;
    const controller = new AbortController();
    fetchPrebook(offerId, controller.signal)
      .then((payload) => {
        const result = readPrebook(payload);
        if (!result) throw new Error("The rate did not return a prebook id.");
        rememberPrebook({
          prebookId: result.prebookId,
          hotelName: result.hotelName || quotedHotel,
          roomName: result.roomName || quotedRoom,
          price: result.price,
          currency: result.currency,
          checkin: stay.checkin || undefined,
          checkout: stay.checkout || undefined,
        });
        setPrebook(result);
        setPhase("ready");
      })
      .catch((reason: unknown) => {
        if (isAbortError(reason)) return;
        setPhase("error");
        setError(errorMessage(reason));
      });
    return () => controller.abort();
  }, [offerId, existingPrebookId, quotedHotel, quotedRoom, stay.checkin, stay.checkout]);

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
    const leadGuest = sameGuest
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
      guests: [leadGuest],
      payment: { method },
    };

    setSubmitting(true);
    setError("");
    try {
      const response = await fetchBook(payload);
      const result = readBooking(response);
      if (!result) throw new Error("The booking did not return a confirmation id.");
      markPrebookBooked(prebook.prebookId);
      setBooking(result);
      setPhase("booked");
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  }

  const backHref = existingPrebookId
    ? "/bookings"
    : slug && hotelId
      ? buildHotelHref({ ...stay, slug, hotelId, city: stay.city || quotedHotel })
      : "/hotels";
  const checkin = stay.checkin || savedStay.checkin;
  const checkout = stay.checkout || savedStay.checkout;
  const hotelLabel = prebook?.hotelName || (existingPrebookId ? "Pre-booking" : quotedHotel);
  const roomLabel = prebook?.roomName || (existingPrebookId ? "Held rate" : quotedRoom);

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
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/bookings" className="inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white">
            View bookings
          </Link>
          <Link href="/hotels" className="inline-flex rounded-full border border-line px-5 py-2.5 text-sm font-semibold">
            Browse more hotels
          </Link>
        </div>
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
          <p className="mt-8 text-sm text-muted">
            {existingPrebookId
              ? "Opening this pre-booking."
              : `Reserving ${quotedRoom} so the rate can be confirmed.`}
          </p>
        ) : null}
        {phase === "error" ? (
          <div className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-ink/8" role="alert">
            <p className="font-display text-3xl">
              {existingPrebookId ? "This pre-booking could not be opened." : "This rate could not be prebooked."}
            </p>
            <p className="mt-2 text-sm text-muted">{error}</p>
            <Link href={backHref} className="mt-4 inline-flex text-sm font-semibold text-clay">
              {existingPrebookId ? "Back to bookings" : "Choose another room"}
            </Link>
          </div>
        ) : null}

        {phase === "ready" && prebook ? (
          <form onSubmit={submit} className="mt-8 space-y-6">
            <fieldset className="grid gap-4 rounded-3xl bg-white p-5 ring-1 ring-ink/8 sm:grid-cols-2">
              <legend className="px-1 text-sm font-semibold">Booker</legend>
              <Field label="First name" name="firstName" autoComplete="given-name" defaultValue={guest.firstName} />
              <Field label="Last name" name="lastName" autoComplete="family-name" defaultValue={guest.lastName} />
              <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={guest.email} />
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

            {signedIn ? null : (
              <p className="rounded-3xl bg-sand px-4 py-3 text-sm leading-6">
                Log in before confirming payment.{" "}
                <Link className="font-semibold text-clay" href="/sign-up">Sign up</Link>
                {" or "}
                <Link className="font-semibold text-clay" href="/sign-in">log in</Link>
                , then return to this pre-booking.
              </p>
            )}

            <fieldset className="rounded-3xl bg-white p-5 ring-1 ring-ink/8">
              <legend className="px-1 text-sm font-semibold">Payment method</legend>
              <p className="mb-3 text-sm text-muted">
                This confirms the pre-booking. Choose the partner account method that pays for the stay.
                Card numbers are not entered on this page.
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
        <p className="text-sm text-muted">{hotelLabel}</p>
        <h2 className="mt-1 font-display text-3xl">{roomLabel}</h2>
        <p className="mt-3 text-sm text-muted">
          {checkin && checkout
            ? `${formatStayDate(checkin)} – ${formatStayDate(checkout)}`
            : "Complete payment before the hold expires."}
        </p>
        {stay.checkin ? (
          <p className="mt-1 text-sm text-muted">{guestLabel(stay.adults, stay.children, stay.rooms)}</p>
        ) : null}
        {prebook?.boardName ? <p className="mt-3 text-sm">{prebook.boardName}</p> : null}
        {prebook?.cancellation ? <p className="mt-2 text-sm text-pine">{prebook.cancellation}</p> : null}
        <p className="mt-5 text-2xl font-semibold">
          {prebook?.price != null
            ? formatMoney(prebook.price, prebook.currency || "NGN")
            : existingPrebookId
              ? "Held rate"
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

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  className = "",
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  className?: string;
  defaultValue?: string;
}) {
  return (
    <label className={`block text-sm font-medium ${className}`}>
      {label}
      <input
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        defaultValue={defaultValue}
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

function readSignedIn() {
  return readAssistantContext().isSignedIn;
}

function text(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}
