import { buildApiUrl } from "@/lib/constants";
import { fetchUserRole, setSessionCookies } from "@/lib/server-auth";
import type { UserRole } from "@/types";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, error: "No refresh token" },
      { status: 401 },
    );
  }

  let tokens: { access_token?: string; refresh_token?: string; token_type?: string };

  try {
    const refreshResponse = await fetch(buildApiUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });

    if (!refreshResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Refresh failed" },
        { status: 401 },
      );
    }

    tokens = await refreshResponse.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Refresh request failed" },
      { status: 502 },
    );
  }

  const accessToken = tokens.access_token;
  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: "Invalid refresh response" },
      { status: 502 },
    );
  }

  const nextRefreshToken = tokens.refresh_token ?? refreshToken;
  const role = ((await fetchUserRole(accessToken)) ?? "user") as UserRole;

  const response = NextResponse.json({
    success: true,
    access_token: accessToken,
    token_type: tokens.token_type ?? "Bearer",
  });

  setSessionCookies(response, {
    accessToken,
    refreshToken: nextRefreshToken,
    role,
  });

  return response;
}
