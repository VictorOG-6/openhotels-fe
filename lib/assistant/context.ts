import { jwtDecode } from "jwt-decode";

import type { User } from "@/types";
import { API_URL } from "@/lib/constants";

export type AssistantContext = {
  apiBaseUrl: string;
  bookingUrl: string;
  loginUrl: string;
  signUpUrl: string;
  isSignedIn: boolean;
  accessToken: string;
  userEmail: string;
  defaultCurrency: string;
  defaultGuestNationality: string;
};

const PUBLIC_API = "https://web-production-8d24e633.up.railway.app";
const PUBLIC_SITE = "https://openhotels.vercel.app";
const EMBED_STRING_MAX = 2048;

type Claims = {
  exp?: number;
  sub?: string;
  email?: string;
};

type SessionSnapshot = {
  isSignedIn: boolean;
  accessToken: string;
  userEmail: string;
};

export function readAssistantContext(): AssistantContext {
  return buildAssistantContext();
}

export function buildAssistantContext(options?: {
  user?: User | null;
  accessToken?: string | null;
}): AssistantContext {
  const origin = browserOrigin();
  const session = options?.accessToken
    ? sessionFromAccessToken(options.accessToken)
    : readStoredSession();

  const profile = options?.user;
  const signedIn = Boolean(profile) || session.isSignedIn;
  const accessToken = (options?.accessToken ?? session.accessToken).trim();
  const userEmail = profile?.email?.trim() || session.userEmail;

  return {
    apiBaseUrl: publicApiBase(),
    bookingUrl: `${origin}/booking`,
    loginUrl: `${origin}/sign-in`,
    signUpUrl: `${origin}/sign-up`,
    isSignedIn: signedIn && Boolean(accessToken),
    accessToken: signedIn && accessToken ? clipForEmbed(accessToken) : "",
    userEmail: signedIn ? userEmail : "",
    defaultCurrency: "NGN",
    defaultGuestNationality: "NG",
  };
}

/** Keeps embed context within AgentPlace limits (per-key string length, total size). */
export function clipForEmbed(value: string, max = EMBED_STRING_MAX) {
  if (value.length <= max) return value;
  return value.slice(0, max);
}

export function syncUserDisplayFromProfile(user: User) {
  if (typeof window === "undefined") return;

  const parts = user.name.trim().split(/\s+/);
  sessionStorage.setItem(
    "user_display",
    JSON.stringify({
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" "),
      email: user.email,
    }),
  );
}

export function readGuestDefaults() {
  let firstName = "";
  let lastName = "";
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem("user_display");
      if (raw) {
        const parsed = JSON.parse(raw) as { firstName?: string; lastName?: string };
        if (typeof parsed.firstName === "string") firstName = parsed.firstName;
        if (typeof parsed.lastName === "string") lastName = parsed.lastName;
      }
    } catch {
      firstName = "";
      lastName = "";
    }
  }
  return {
    firstName,
    lastName,
    email: readAssistantContext().userEmail,
  };
}

function browserOrigin() {
  if (typeof window === "undefined") return PUBLIC_SITE;
  const origin = window.location.origin;
  if (!origin || origin === "null") return PUBLIC_SITE;
  return origin;
}

function publicApiBase() {
  const configured = API_URL;
  const local = /localhost|127\.0\.0\.1/.test(configured);
  if (configured.startsWith("https://") && !local) return configured;
  return PUBLIC_API;
}

function readStoredSession(): SessionSnapshot {
  const empty = { isSignedIn: false, accessToken: "", userEmail: "" };
  if (typeof window === "undefined") return empty;

  const token = sessionStorage.getItem("access_token")?.trim() ?? "";
  if (!token) return empty;

  return sessionFromAccessToken(token);
}

function sessionFromAccessToken(token: string): SessionSnapshot {
  const empty = { isSignedIn: false, accessToken: "", userEmail: "" };
  if (!token || token.length > EMBED_STRING_MAX) return empty;

  try {
    const claims = jwtDecode<Claims>(token);
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp && claims.exp <= now) return empty;

    return {
      isSignedIn: true,
      accessToken: token,
      userEmail: claimEmail(claims) || displayEmail(),
    };
  } catch {
    return empty;
  }
}

function claimEmail(claims: Claims) {
  if (typeof claims.email === "string" && claims.email.includes("@")) {
    return claims.email.trim();
  }
  if (typeof claims.sub === "string" && claims.sub.includes("@")) {
    return claims.sub.trim();
  }
  return "";
}

function displayEmail() {
  try {
    const raw = sessionStorage.getItem("user_display");
    if (!raw) return "";
    const parsed = JSON.parse(raw) as { email?: string };
    return typeof parsed.email === "string" ? parsed.email.trim().slice(0, 320) : "";
  } catch {
    return "";
  }
}
