import { jwtDecode } from "jwt-decode";

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

type Claims = {
  exp?: number;
  sub?: string;
  email?: string;
};

export function readAssistantContext(): AssistantContext {
  const origin = browserOrigin();
  const session = readToken();
  return {
    apiBaseUrl: publicApiBase(),
    bookingUrl: `${origin}/booking`,
    loginUrl: `${origin}/sign-in`,
    signUpUrl: `${origin}/sign-up`,
    isSignedIn: session.isSignedIn,
    accessToken: session.isSignedIn ? session.accessToken : "",
    userEmail: session.isSignedIn ? session.userEmail : "",
    defaultCurrency: "NGN",
    defaultGuestNationality: "NG",
  };
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
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  const local = /localhost|127\.0\.0\.1/.test(configured);
  if (configured.startsWith("https://") && !local) return configured;
  return PUBLIC_API;
}

function readToken() {
  const empty = { isSignedIn: false, accessToken: "", userEmail: "" };
  if (typeof window === "undefined") return empty;
  try {
    const token = sessionStorage.getItem("access_token")?.trim() ?? "";
    if (!token || token.length > 2048) return empty;
    const claims = jwtDecode<Claims>(token);
    const now = Math.floor(Date.now() / 1000);
    if (!claims.exp || claims.exp <= now) return empty;
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
  if (typeof claims.email === "string" && claims.email.includes("@")) return claims.email.trim();
  if (typeof claims.sub === "string" && claims.sub.includes("@")) return claims.sub.trim();
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
