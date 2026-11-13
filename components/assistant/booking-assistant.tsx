"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

import { useUserContext } from "@/contexts/user/user-context";
import { syncUserDisplayFromProfile } from "@/lib/assistant/context";
import {
  ASSISTANT_SCRIPT,
  refreshAssistantAuthContext,
} from "@/lib/assistant/embed";

export default function BookingAssistant() {
  const { user, isUserLoading } = useUserContext();
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    let cancelled = false;

    const publish = () => {
      if (cancelled || isUserLoading) return;

      const profile = userRef.current;
      if (profile) {
        syncUserDisplayFromProfile(profile);
      }

      void refreshAssistantAuthContext(profile ?? null);
    };

    publish();
    window.addEventListener("focus", publish);
    document.addEventListener("visibilitychange", publish);
    const timer = window.setInterval(publish, 4000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", publish);
      document.removeEventListener("visibilitychange", publish);
      window.clearInterval(timer);
    };
  }, [user, isUserLoading]);

  return (
    <Script
      src={ASSISTANT_SCRIPT}
      strategy="afterInteractive"
      onLoad={() => {
        void refreshAssistantAuthContext(userRef.current ?? null);
      }}
    />
  );
}
