"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { completeAuthFromApiResponse } from "@/lib/auth-session";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Processing authentication...");

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const accessToken = searchParams.get("access_token");
        const refreshToken = searchParams.get("refresh_token");

        if (!accessToken || !refreshToken) {
          setError("Authentication failed. Missing tokens.");
          setStatus("");
          setTimeout(() => router.push("/sign-in"), 3000);
          return;
        }

        setStatus("Creating secure session...");

        await completeAuthFromApiResponse({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        setStatus("Authentication successful! Redirecting...");

        const redirectUri = searchParams.get("redirect_uri");
        setTimeout(() => {
          router.push(
            redirectUri && redirectUri.startsWith("/") ? redirectUri : "/",
          );
          router.refresh();
        }, 500);
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        setStatus("");
        setTimeout(() => router.push("/sign-in"), 3000);
      }
    };

    handleOAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        {error ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Authentication Failed
            </h2>
            <p className="mb-4 text-neutral-500">{error}</p>
            <p className="text-sm text-neutral-500">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              {status}
            </h2>
            <p className="text-neutral-500">Please wait...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              Loading...
            </h2>
            <p className="text-neutral-500">Please wait...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
