"use client";

import Script from "next/script";
import { useEffect } from "react";

import { readAssistantContext } from "@/lib/assistant/context";
import { ASSISTANT_SCRIPT, publishAssistantContext } from "@/lib/assistant/embed";

export default function BookingAssistant() {
  useEffect(() => {
    let last = "";
    const publish = () => {
      const context = readAssistantContext();
      const key = JSON.stringify(context);
      if (key === last) return;
      last = key;
      void publishAssistantContext(context);
    };

    publish();
    window.addEventListener("focus", publish);
    document.addEventListener("visibilitychange", publish);
    const timer = window.setInterval(publish, 4000);
    return () => {
      window.removeEventListener("focus", publish);
      document.removeEventListener("visibilitychange", publish);
      window.clearInterval(timer);
    };
  }, []);

  return (
    <Script
      src={ASSISTANT_SCRIPT}
      strategy="afterInteractive"
      onLoad={() => {
        void publishAssistantContext();
      }}
    />
  );
}
