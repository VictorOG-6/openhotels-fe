"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export function Photo({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        aria-hidden={alt === ""}
        className={cn("h-full w-full bg-[linear-gradient(145deg,#1e3d32,#c4a574)]", className)}
      />
    );
  }

  return (
    // Hotel photos arrive from partner CDNs that are not known at build time.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}

export function Stars({ value }: { value?: number }) {
  if (value == null || !Number.isFinite(value)) return null;
  const filled = Math.min(5, Math.max(0, Math.round(value)));

  return (
    <p className="text-sm tracking-wide" aria-label={`${filled} of 5 stars`}>
      <span className="text-clay" aria-hidden>
        {"★".repeat(filled)}
      </span>
      <span className="text-ink/15" aria-hidden>
        {"★".repeat(5 - filled)}
      </span>
    </p>
  );
}
