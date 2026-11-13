"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { readAssistantContext } from "@/lib/assistant/context";
import {
  errorMessage,
  fetchBooking,
  fetchBookings,
  HotelApiError,
  isAbortError,
} from "@/lib/hotels/api";
import { formatMoney, formatStayDate } from "@/lib/hotels/format";
import { readBooking, readBookingList } from "@/lib/hotels/parse";
import {
  isPrebookId,
  listPendingPrebooks,
  rememberPrebook,
  type StoredPrebook,
} from "@/lib/hotels/prebook-store";
import type { BookingResult } from "@/lib/hotels/types";

export default function BookingsList() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [prebooks, setPrebooks] = useState<StoredPrebook[]>([]);
  const [bookings, setBookings] = useState<BookingResult[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingsError, setBookingsError] = useState("");
  const [prebookId, setPrebookId] = useState("");
  const [prebookError, setPrebookError] = useState("");
  const [lookupId, setLookupId] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookup, setLookup] = useState<BookingResult | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  useEffect(() => {
    const session = readAssistantContext();
    setSignedIn(session.isSignedIn);
    setPrebooks(listPendingPrebooks());
    setReady(true);

    if (!session.isSignedIn) {
      setLoadingBookings(false);
      return;
    }

    const controller = new AbortController();
    fetchBookings(controller.signal)
      .then((payload) => {
        setBookings(readBookingList(payload));
      })
      .catch((reason: unknown) => {
        if (isAbortError(reason)) return;
        if (reason instanceof HotelApiError && reason.status === 401) {
          setSignedIn(false);
          setBookingsError("");
          return;
        }
        setBookingsError(errorMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingBookings(false);
      });

    return () => controller.abort();
  }, []);

  function openPrebook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = prebookId.trim();
    if (!isPrebookId(id)) {
      setPrebookError("Enter the pre-booking id shown in the assistant.");
      return;
    }
    rememberPrebook({ prebookId: id });
    router.push(`/booking?prebookId=${encodeURIComponent(id)}`);
  }

  async function lookupBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = lookupId.trim();
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
      setLookupError("Enter the booking id from your confirmation.");
      setLookup(null);
      return;
    }
    setLookingUp(true);
    setLookupError("");
    try {
      const result = readBooking(await fetchBooking(id));
      if (!result) throw new Error("No booking was returned.");
      setLookup(result);
    } catch (reason) {
      setLookup(null);
      setLookupError(errorMessage(reason));
    } finally {
      setLookingUp(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-5 pb-24 pt-28">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
        Bookings
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-tight">Your stays</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
        A pre-booking holds a rate. Open it and add payment details to confirm
        the stay. Confirmed bookings are listed separately.
      </p>

      <div className="mt-10">
        <h2 className="font-display text-3xl">Pre-bookings</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Holds from this browser appear here. If the assistant created one, use
          the id it showed on screen.
        </p>
        {!ready ? (
          <p className="mt-4 text-sm text-neutral-500">Loading pre-bookings</p>
        ) : prebooks.length ? (
          <ul className="mt-4 space-y-3">
            {prebooks.map((prebook) => (
              <li
                key={prebook.prebookId}
                className="rounded-3xl bg-white p-5 ring-1 ring-ink/8"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">
                      Pre-booking
                    </p>
                    <p className="mt-1 font-display text-2xl">
                      {prebook.hotelName || "Hotel hold"}
                    </p>
                    {prebook.roomName ? (
                      <p className="mt-1 text-sm text-neutral-500">
                        {prebook.roomName}
                      </p>
                    ) : null}
                    {prebook.checkin && prebook.checkout ? (
                      <p className="mt-2 text-sm text-neutral-500">
                        {formatStayDate(prebook.checkin)} –{" "}
                        {formatStayDate(prebook.checkout)}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-neutral-500">
                      Prebook {prebook.prebookId}
                    </p>
                  </div>
                  <div className="text-right">
                    {prebook.price != null ? (
                      <p className="text-lg font-semibold">
                        {formatMoney(prebook.price, prebook.currency || "NGN")}
                      </p>
                    ) : (
                      <p className="text-sm text-neutral-500">
                        Price confirmed at payment
                      </p>
                    )}
                    <Link
                      href={`/booking?prebookId=${encodeURIComponent(prebook.prebookId)}`}
                      className="mt-3 inline-flex rounded-full bg-clay px-4 py-2 text-sm font-semibold text-white hover:bg-clay-dark"
                    >
                      Complete booking
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-3xl bg-white px-5 py-4 text-sm text-neutral-500 ring-1 ring-ink/8">
            No open pre-bookings on this device.
          </p>
        )}

        <form
          onSubmit={openPrebook}
          className="mt-4 rounded-3xl bg-white p-5 ring-1 ring-ink/8"
        >
          <label className="block text-sm font-medium" htmlFor="prebook-id">
            Pre-booking id
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="prebook-id"
              value={prebookId}
              onChange={(event) => setPrebookId(event.target.value)}
              autoComplete="off"
              className="w-full rounded-2xl border border-line px-3 py-3 outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white"
            >
              Open pre-booking
            </button>
          </div>
          {prebookError ? (
            <p className="mt-3 text-sm text-clay" role="alert">
              {prebookError}
            </p>
          ) : null}
        </form>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-3xl">Bookings</h2>
        {!ready || loadingBookings ? (
          <p className="mt-4 text-sm text-neutral-500">Loading bookings</p>
        ) : !signedIn ? (
          <div className="mt-4 rounded-3xl bg-white p-5 ring-1 ring-ink/8">
            <p className="text-sm leading-6 text-neutral-500">
              Sign in to see confirmed bookings for this account.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="rounded-full bg-clay px-4 py-2 text-sm font-semibold text-white"
              >
                Sign up
              </Link>
              <Link
                href="/sign-in"
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold"
              >
                Log in
              </Link>
            </div>
          </div>
        ) : bookingsError ? (
          <p className="mt-4 text-sm text-clay" role="alert">
            {bookingsError}
          </p>
        ) : bookings.length ? (
          <ul className="mt-4 space-y-3">
            {bookings.map((booking) => (
              <BookingCard key={booking.bookingId} booking={booking} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-3xl bg-white px-5 py-4 text-sm text-neutral-500 ring-1 ring-ink/8">
            No confirmed bookings in the last year. Complete a pre-booking to
            create one.
          </p>
        )}

        <form
          onSubmit={lookupBooking}
          className="mt-4 rounded-3xl bg-white p-5 ring-1 ring-ink/8"
        >
          <label className="block text-sm font-medium" htmlFor="booking-id">
            Look up a booking id
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="booking-id"
              value={lookupId}
              onChange={(event) => setLookupId(event.target.value)}
              autoComplete="off"
              className="w-full rounded-2xl border border-line px-3 py-3 outline-none"
            />
            <button
              type="submit"
              disabled={lookingUp}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {lookingUp ? "Looking up" : "Look up"}
            </button>
          </div>
          {lookupError ? (
            <p className="mt-3 text-sm text-clay" role="alert">
              {lookupError}
            </p>
          ) : null}
          {lookup ? (
            <div className="mt-4 border-t border-line pt-4">
              <BookingCard booking={lookup} />
            </div>
          ) : null}
        </form>
      </div>

      <Link
        href="/hotels"
        className="mt-8 inline-flex text-sm font-semibold text-clay"
      >
        Find a hotel
      </Link>
    </section>
  );
}

function BookingCard({ booking }: { booking: BookingResult }) {
  return (
    <article className="rounded-3xl bg-white p-5 ring-1 ring-ink/8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pine">
        {booking.status || "Confirmed"}
      </p>
      <p className="mt-1 font-display text-2xl">
        {booking.hotelName || "Hotel"}
      </p>
      {booking.checkin && booking.checkout ? (
        <p className="mt-2 text-sm text-neutral-500">
          {formatStayDate(booking.checkin)} – {formatStayDate(booking.checkout)}
        </p>
      ) : null}
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-500">Booking</dt>
          <dd className="font-medium">{booking.bookingId}</dd>
        </div>
        {booking.confirmationCode ? (
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Hotel confirmation</dt>
            <dd className="font-medium">{booking.confirmationCode}</dd>
          </div>
        ) : null}
        {booking.price != null ? (
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Total</dt>
            <dd className="font-medium">
              {formatMoney(booking.price, booking.currency || "NGN")}
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
