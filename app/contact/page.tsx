import type { Metadata } from "next";

import ContactForm from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Write to Open Hotels about a stay, a rate, or a booking.",
};

export default function ContactPage() {
  return (
    <article className="mx-auto grid max-w-6xl gap-10 px-5 pb-24 pt-28 md:grid-cols-[0.8fr_1.1fr] md:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">Contact</p>
        <h1 className="mt-3 font-display text-5xl tracking-tight">Write to the desk.</h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Questions about a rate, a missing hotel, or a booking id can come here.
        </p>
        <dl className="mt-8 space-y-4 text-sm">
          <div>
            <dt className="text-muted">Email</dt>
            <dd><a className="font-medium" href="mailto:hello@openhotels.com">hello@openhotels.com</a></dd>
          </div>
          <div>
            <dt className="text-muted">Desk hours</dt>
            <dd>Every day, 8:00–20:00 WAT</dd>
          </div>
        </dl>
      </div>
      <ContactForm />
    </article>
  );
}
