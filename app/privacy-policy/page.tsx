import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Open Hotels collects, uses, and protects your information.",
};

const sections = [
  {
    title: "Overview",
    body: [
      "This Privacy Policy describes how Open Hotels (“we,” “us”) handles personal information when you use our websites, apps, and booking services (the “Service”).",
      "By using the Service, you agree to the practices described here. If you do not agree, do not use the Service.",
    ],
  },
  {
    title: "Information we collect",
    body: [
      "Account information: name, email, and profile details you provide when you register or update your account.",
      "Booking information: search queries, selected hotels and rates, guest and booker names, contact details, and booking references needed to complete a reservation with partners.",
      "Technical data: device type, browser, IP address, general location derived from IP, cookies, and similar identifiers used to run and secure the Service.",
      "Communications: messages you send to support and feedback you choose to provide.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "Provide search, prebook, and booking features; authenticate you; and display your booking history.",
      "Communicate about bookings, account security, and Service updates.",
      "Improve reliability, prevent fraud and abuse, and comply with law.",
      "With your consent where required, send product updates or marketing. You can opt out of marketing emails at any time.",
    ],
  },
  {
    title: "How we share information",
    body: [
      "Hotel partners and their distribution systems receive the guest and booking data needed to fulfill your reservation.",
      "Service providers that host infrastructure, analytics, authentication, and customer support process data on our instructions and under contractual safeguards.",
      "We may disclose information when required by law, to protect rights and safety, or in connection with a merger or sale of assets, with notice where appropriate.",
      "We do not sell your personal information.",
    ],
  },
  {
    title: "Cookies and similar technologies",
    body: [
      "We use cookies and local storage to keep you signed in, remember preferences, and understand how the Service is used. You can control cookies through browser settings; some features may not work without them.",
    ],
  },
  {
    title: "Retention",
    body: [
      "We keep personal information for as long as needed to provide the Service, meet legal and accounting obligations, resolve disputes, and enforce agreements. Booking records may be retained longer where partners or law require.",
    ],
  },
  {
    title: "Security",
    body: [
      "We use administrative, technical, and organizational measures designed to protect personal information. No method of transmission or storage is completely secure.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "Depending on where you live, you may have rights to access, correct, delete, or export your personal information, and to object to or restrict certain processing. Contact us to exercise these rights. We may need to verify your identity.",
      "If you use the Service in the European Economic Area or United Kingdom, you may also lodge a complaint with your local data protection authority.",
    ],
  },
  {
    title: "Children",
    body: [
      "The Service is not directed at children under 16. We do not knowingly collect personal information from children. Contact us if you believe a child has provided information to us.",
    ],
  },
  {
    title: "International transfers",
    body: [
      "We and our partners may process information in countries other than where you live. Where required, we use appropriate safeguards for cross-border transfers.",
    ],
  },
  {
    title: "Changes",
    body: [
      "We may update this Policy from time to time. We will post the revised version on this page and update the “Last updated” date. Material changes may also be communicated by email or in the product.",
    ],
  },
] as const;

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 pb-24 pt-28 md:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">Legal</p>
      <h1 className="mt-3 font-display text-5xl tracking-tight md:text-6xl">Privacy Policy</h1>
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
            Privacy questions:{" "}
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
