import { jwtDecode } from "jwt-decode";
import type { NextResponse } from "next/server";
import type { UserRole } from "@/types";

interface DecodedToken {
  exp: number;
}

export const USER_ROLE_COOKIE = "user_role";

const VALID_ROLES = new Set<UserRole>(["admin", "staff", "user"]);

export interface AuthCookies {
  access_token?: string;
  refresh_token?: string;
  user_role?: string;
}

export function isTokenValid(token: string): boolean {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function parseUserRole(role: string | undefined): UserRole | null {
  if (!role || !VALID_ROLES.has(role as UserRole)) {
    return null;
  }

  return role as UserRole;
}

export function hasValidAuthToken(cookies: AuthCookies): boolean {
  const accessToken = cookies.access_token;
  if (accessToken && isTokenValid(accessToken)) {
    return true;
  }

  const refreshToken = cookies.refresh_token;
  return Boolean(refreshToken && isTokenValid(refreshToken));
}

export function areAuthTokensExpired(cookies: AuthCookies): boolean {
  const accessToken = cookies.access_token;
  const refreshToken = cookies.refresh_token;

  if (!accessToken && !refreshToken) {
    return false;
  }

  const accessExpired = !accessToken || !isTokenValid(accessToken);
  const refreshExpired = !refreshToken || !isTokenValid(refreshToken);

  return accessExpired && refreshExpired;
}

export function resolveLocalAuthSession(
  cookies: AuthCookies,
): AuthSessionResult {
  const role = parseUserRole(cookies.user_role);

  if (!role || !hasValidAuthToken(cookies)) {
    return { user: null };
  }

  return { user: { role } };
}

export function setSessionCookies(
  response: NextResponse,
  {
    accessToken,
    refreshToken,
    role,
  }: {
    accessToken: string;
    refreshToken: string;
    role: UserRole;
  },
) {
  response.cookies.set({
    name: "access_token",
    value: accessToken,
    ...getAuthCookieOptions(accessToken),
  });
  response.cookies.set({
    name: "refresh_token",
    value: refreshToken,
    ...getAuthCookieOptions(refreshToken),
  });
  response.cookies.set({
    name: USER_ROLE_COOKIE,
    value: role,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: getCookieMaxAge(refreshToken),
    path: "/",
  });
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");
  response.cookies.delete(USER_ROLE_COOKIE);
}

export async function fetchUserRole(
  accessToken: string,
): Promise<UserRole | null> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return null;

  const user = await fetchUser(accessToken);
  return parseUserRole(user?.role);
}

export interface AuthSessionResult {
  user: { role: UserRole } | null;
  tokens?: {
    access_token: string;
    refresh_token: string;
  };
}

function getApiUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL;
}

function getCookieMaxAge(token: string): number {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return Math.max(decoded.exp - Math.floor(Date.now() / 1000), 0);
  } catch {
    return 0;
  }
}

export function getAuthCookieOptions(token: string) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: getCookieMaxAge(token),
    path: "/",
  };
}

async function refreshTokens(
  refreshToken: string,
): Promise<{ access_token: string; refresh_token: string } | null> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return null;

  try {
    const response = await fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });

    if (!response.ok) return null;

    return response.json();
  } catch {
    return null;
  }
}

async function fetchUser(
  accessToken: string,
): Promise<{ role?: UserRole } | null> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return null;

  try {
    const response = await fetch(`${apiUrl}/user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) return null;

    return response.json();
  } catch {
    return null;
  }
}

export async function resolveAuthSession(
  cookies: AuthCookies,
): Promise<AuthSessionResult> {
  if (!getApiUrl()) {
    return { user: null };
  }

  let refreshedTokens: AuthSessionResult["tokens"];
  const accessToken = cookies.access_token;

  if (accessToken) {
    const user = await fetchUser(accessToken);
    if (user?.role) {
      return { user: { role: user.role } };
    }
  }

  const refreshToken = cookies.refresh_token;
  if (!refreshToken) {
    return { user: null };
  }

  const tokens = await refreshTokens(refreshToken);
  if (!tokens) {
    return { user: null };
  }

  refreshedTokens = tokens;

  const user = await fetchUser(tokens.access_token);
  if (!user?.role) {
    return { user: null, tokens: refreshedTokens };
  }

  return { user: { role: user.role }, tokens: refreshedTokens };
}
