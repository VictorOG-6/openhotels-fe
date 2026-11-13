import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing your use of Open Hotels.",
};

const sections = [
  {
    title: "Agreement",
    body: [
      "These Terms of Service (“Terms”) apply when you use Open Hotels websites, apps, and related services (collectively, the “Service”). By creating an account, searching hotels, or completing a booking, you agree to these Terms.",
      "If you do not agree, do not use the Service.",
    ],
  },
  {
    title: "The Service",
    body: [
      "Open Hotels is a booking desk that helps you search live hotel inventory, compare rates, and reserve stays through our hotel partners. We display rates, availability, board types, and cancellation rules supplied by partners at search time.",
      "We do not own or operate the hotels listed. Your stay is provided by the hotel and its distribution partner under the conditions shown when you prebook and book.",
    ],
  },
  {
    title: "Accounts",
    body: [
      "You must provide accurate registration information and keep your credentials secure. You are responsible for activity under your account.",
      "We may suspend or close accounts that violate these Terms, misuse the Service, or create fraud or security risk.",
    ],
  },
  {
    title: "Search, prebook, and booking",
    body: [
      "Rates and availability are dynamic. A rate shown in search results is not guaranteed until prebook confirms it. The prebook step locks the price and terms shown on the booking page for a limited time.",
      "If a partner changes price, board, or cancellation terms before you complete booking, we will show the updated details and ask you to confirm before proceeding.",
      "Payment for a stay is handled according to the method and rules of the partner account, as described at booking. This Service does not collect guest card details for partner-settled payments unless we explicitly say otherwise on the booking flow.",
    ],
  },
  {
    title: "Cancellations and changes",
    body: [
      "Cancellation and change rules depend on the rate you selected. They are shown during search, prebook, and on your booking confirmation. Follow the instructions in your confirmation or contact us if you need help.",
      "We are not responsible for partner refusal of a cancellation or change that falls outside the published rules, except as required by applicable law.",
    ],
  },
  {
    title: "Acceptable use",
    body: [
      "You may not scrape, reverse engineer, or overload the Service; use automated means to book except through interfaces we provide; misrepresent identity; or use the Service for unlawful purposes.",
      "You may not resell access to the Service or use it to compete unfairly with our partners.",
    ],
  },
  {
    title: "Disclaimers",
    body: [
      "The Service is provided “as is” and “as available.” We do not warrant uninterrupted or error-free operation. Hotel descriptions, photos, and amenities come from partners and may change.",
      "To the fullest extent permitted by law, we disclaim implied warranties of merchantability, fitness for a particular purpose, and non-infringement.",
    ],
  },
  {
    title: "Limitation of liability",
    body: [
      "Open Hotels is not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits or data, arising from your use of the Service or a stay booked through it.",
      "Our total liability for claims relating to the Service is limited to the greater of (a) amounts you paid us for the Service in the twelve months before the claim, or (b) one hundred U.S. dollars, except where such limits are not allowed by law.",
    ],
  },
  {
    title: "Changes",
    body: [
      "We may update these Terms from time to time. We will post the revised version on this page and update the “Last updated” date. Material changes may also be notified by email or in the product. Continued use after changes take effect constitutes acceptance.",
    ],
  },
] as const;

export default function TermsOfServicePage() {
  return (
    <article className="mx-auto max-w-3xl px-5 pb-24 pt-28 md:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">Legal</p>
      <h1 className="mt-3 font-display text-5xl tracking-tight md:text-6xl">Terms of Service</h1>
      <p className="mt-4 text-sm text-muted">Last updated: November 13, 2026</p>
      <div className="mt-12 space-y-10 text-base leading-7 text-muted">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-2xl text-ink">{section.title}</h2>
            <div className="mt-3 space-y-3">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
        <section>
          <h2 className="font-display text-2xl text-ink">Contact</h2>
          <p className="mt-3 text-base leading-7 text-muted">
            Questions about these Terms:{" "}
            <a className="font-medium text-clay hover:text-clay-dark" href="mailto:hello@openhotels.com">
              hello@openhotels.com
            </a>{" "}
            or our{" "}
            <Link className="font-medium text-clay hover:text-clay-dark" href="/contact">
              contact page
            </Link>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
