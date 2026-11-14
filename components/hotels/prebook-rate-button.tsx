"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { useUserContext } from "@/contexts/user/user-context";
import { cn } from "@/lib/utils";

type PrebookRateButtonProps = {
  href: string;
  label?: string;
  className?: string;
};

export default function PrebookRateButton({
  href,
  label = "Prebook this rate",
  className,
}: PrebookRateButtonProps) {
  const { user, isUserLoading } = useUserContext();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const signedIn = Boolean(user);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const signInHref = `/sign-in?redirectUri=${encodeURIComponent(href)}`;
  const signUpHref = `/sign-up?redirectUri=${encodeURIComponent(href)}`;

  if (isUserLoading) {
    return (
      <span
        className={cn(
          "inline-flex cursor-wait rounded-full bg-clay/45 px-5 py-2.5 text-sm font-semibold text-white",
          className,
        )}
        aria-busy="true"
      >
        {label}
      </span>
    );
  }

  if (signedIn) {
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-white hover:bg-clay-dark",
          className,
        )}
      >
        {label}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-sand",
          className,
        )}
      >
        Sign in to prebook
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-ink/10"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={titleId} className="font-display text-2xl tracking-tight">
              Sign in to prebook
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              You need an account before we can hold this rate. After you sign
              in, you will return here to confirm the room.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={signInHref}
                className="rounded-full bg-clay px-4 py-2 text-sm font-semibold text-white hover:bg-clay-dark"
                onClick={() => setOpen(false)}
              >
                Log in
              </Link>
              <Link
                href={signUpHref}
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-sand"
                onClick={() => setOpen(false)}
              >
                Sign up
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-4 py-2 text-sm font-medium text-neutral-500 hover:text-ink"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}