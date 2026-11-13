import { jwtDecode } from "jwt-decode";

import { addAccessTokenToHttpInstance } from "@/lib/http";

const isTokenValid = (token: string) => {
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    return decoded.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
};

/** Returns a valid access token from session storage or httpOnly refresh cookies. */
export async function getClientAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const existingToken = sessionStorage.getItem("access_token");
  if (existingToken && isTokenValid(existingToken)) return existingToken;

  const response = await fetch("/api/auth/refresh-token", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    success?: boolean;
    access_token?: string;
  };

  if (!data.success || !data.access_token) return null;

  sessionStorage.setItem("access_token", data.access_token);
  addAccessTokenToHttpInstance(data.access_token);

  return data.access_token;
}
