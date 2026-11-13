import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import BookingAssistant from "@/components/assistant/booking-assistant";
import Footer from "@/components/layout/footer";
import Navbar, { NavbarFallback } from "@/components/layout/navbar";
import Providers from "@/lib/provider";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Open Hotels",
    template: "%s · Open Hotels",
  },
  description: "Search live hotel rates, compare rooms on a map, and book a stay.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        <Providers>
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2"
          >
            Skip to content
          </a>
          <Suspense fallback={<NavbarFallback />}>
            <Navbar />
          </Suspense>
          <main id="content" className="flex-1">
            {children}
          </main>
          <Footer />
          <BookingAssistant />
          <Toaster position="top-center" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
