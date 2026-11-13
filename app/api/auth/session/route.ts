import { buildApiUrl } from "@/lib/constants";
import {
  clearSessionCookies,
  parseUserRole,
  setSessionCookies,
} from "@/lib/server-auth";
import { parseUserFromApi } from "@/lib/user-response";
import type { UserRole } from "@/types";
import { NextResponse } from "next/server";

type SessionBody = {
  accessToken?: string;
  refreshToken?: string;
  role?: string;
};

async function resolveRole(
  accessToken: string,
  roleFromBody: string | undefined,
): Promise<UserRole> {
  const parsed = parseUserRole(roleFromBody);
  if (parsed) return parsed;

  try {
    const response = await fetch(buildApiUrl("/user"), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (response.ok) {
      const body = await response.json();
      const profile = parseUserFromApi(body);
      const fromApi = parseUserRole(profile?.role);
      if (fromApi) return fromApi;
    }
  } catch {
    // fall through to default role
  }

  return "user";
}

export async function POST(request: Request) {
  let body: SessionBody;

  try {
    body = (await request.json()) as SessionBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { accessToken, refreshToken, role } = body;

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
  }

  const resolvedRole = await resolveRole(accessToken, role);

  const response = NextResponse.json({ success: true });
  setSessionCookies(response, {
    accessToken,
    refreshToken,
    role: resolvedRole,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearSessionCookies(response);
  return response;
}
