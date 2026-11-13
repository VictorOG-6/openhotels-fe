import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Open Hotels is a booking desk for live hotel inventory.",
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-6xl px-5 pb-24 pt-28 md:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">
        About
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl tracking-tight md:text-6xl">
        A hotel search that shows the rate before the pitch.
      </h1>
      <div className="mt-10 grid items-start gap-10 md:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80"
          alt="Hotel pool and lounge chairs"
          className="h-full max-h-[520px] w-full rounded-3xl object-cover"
        />
        <div className="space-y-5 text-lg leading-8 text-neutral-500">
          <p>
            Open Hotels is a booking desk for live hotel inventory. You search a
            city, compare rooms on a map, and reserve a specific rate.
          </p>
          <p>
            The price confirmed at prebook is the price sent with the booking.
            If the partner changes the rate, the board, or the cancellation
            terms, the booking page says so before you confirm.
          </p>
          <p>
            Payment uses the partner account method. This form does not collect
            a guest card number.
          </p>
        </div>
      </div>
      <ul className="mt-14 grid gap-4 md:grid-cols-3">
        {[
          [
            "Clear rates",
            "Each room shows the total, the board, and whether you can cancel.",
          ],
          [
            "A map that stays with the list",
            "Hotels in the results are the hotels on the map.",
          ],
          [
            "Two steps to book",
            "Prebook the offer, then send the booker and lead guest.",
          ],
        ].map(([title, copy]) => (
          <li key={title} className="rounded-3xl bg-sand p-6">
            <h2 className="font-display text-2xl">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">{copy}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
