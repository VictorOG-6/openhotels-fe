import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-32 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">404</p>
      <h1 className="mt-3 font-display text-5xl">That page is not on the map.</h1>
      <Link href="/" className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white">
        Back home
      </Link>
    </div>
  );
}
