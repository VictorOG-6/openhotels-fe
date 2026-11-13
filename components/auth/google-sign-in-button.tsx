"use client";

import { Loader2 } from "lucide-react";

type GoogleSignInButtonProps = {
  onClick: () => void;
  loading?: boolean;
  label?: string;
};

export default function GoogleSignInButton({
  onClick,
  loading = false,
  label = "Continue with Google",
}: GoogleSignInButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-sand disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <GoogleMark />
      )}
      {loading ? "Redirecting..." : label}
    </button>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.93a8.78 8.78 0 0 0 2.67-6.61z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.93-2.26a5.52 5.52 0 0 1-8.34-2.9H1.5v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.72 10.66a5.42 5.42 0 0 1 0-3.32V5.01H1.5a9 9 0 0 0 0 8.02l2.22-2.37z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A8.96 8.96 0 0 0 9 0 9 9 0 0 0 1.5 5.01l2.22 2.33A5.47 5.47 0 0 1 9 3.58z"
      />
    </svg>
  );
}
