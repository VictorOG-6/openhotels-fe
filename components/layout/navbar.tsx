"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/hotels", label: "Hotels" },
  { href: "/bookings", label: "Bookings", match: ["/bookings", "/booking"] },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const onHero = pathname === "/";
  const solid = !onHero || scrolled || open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition",
        solid ? "border-b border-line bg-paper/95 backdrop-blur" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-5 md:px-8">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className={cn("font-display text-2xl tracking-tight", solid ? "text-ink" : "text-white")}
        >
          Open Hotels
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map((link) => {
            const active = isActive(pathname, link);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-medium",
                  active
                    ? solid
                      ? "bg-ink text-white"
                      : "bg-white text-ink"
                    : solid
                      ? "text-ink hover:bg-sand"
                      : "text-white hover:bg-white/15",
                )}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className={cn(
            "grid h-10 w-10 place-items-center rounded-full md:hidden",
            solid ? "text-ink" : "text-white",
          )}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close" : "Menu"}</span>
          <span aria-hidden className="flex w-5 flex-col gap-1.5">
            <span className="h-0.5 w-full bg-current" />
            <span className="h-0.5 w-full bg-current" />
            <span className="h-0.5 w-3/4 bg-current" />
          </span>
        </button>
      </div>
      {open ? (
        <nav className="border-t border-line bg-paper px-5 py-3 md:hidden" aria-label="Mobile">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-3 py-3 text-base font-medium text-ink hover:bg-sand"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

export function NavbarFallback() {
  return <div className="fixed inset-x-0 top-0 z-50 h-16" />;
}

function isActive(pathname: string, link: { href: string; match?: string[] }) {
  const paths = link.match ?? [link.href];
  return paths.some((href) => pathname === href || pathname.startsWith(`${href}/`));
}
