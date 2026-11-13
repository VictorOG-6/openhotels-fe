import {
  getAuthPayload,
  storeAuthToken,
  validateToken,
  type AuthResponse,
} from "@/lib/auth";
import { addAccessTokenToHttpInstance, $http } from "@/lib/http";
import { parseUserFromApi } from "@/lib/user-response";
import type { UserRole } from "@/types";

type SessionUser = {
  name: string;
  email: string;
};

export async function persistAuthSession(
  tokens: {
    access_token: string;
    refresh_token: string;
    user: SessionUser;
  },
  role?: UserRole,
) {
  validateToken(tokens.access_token);
  await storeAuthToken(tokens.access_token, tokens.refresh_token, role);

  sessionStorage.setItem("access_token", tokens.access_token);
  sessionStorage.setItem("refresh_token", tokens.refresh_token);

  const parts = tokens.user.name.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");

  sessionStorage.setItem(
    "user_display",
    JSON.stringify({
      firstName,
      lastName,
      email: tokens.user.email,
    }),
  );

  addAccessTokenToHttpInstance(tokens.access_token);
}

/**
 * Parse tokens from a backend auth response, load the user profile from the API,
 * and persist the session locally.
 */
export async function completeAuthFromApiResponse(
  apiBody: unknown,
): Promise<void> {
  const payload = getAuthPayload(apiBody as AuthResponse);

  addAccessTokenToHttpInstance(payload.access_token);

  let profile = parseUserFromApi(payload);

  if (!profile) {
    try {
      const { data } = await $http.get("/user");
      profile = parseUserFromApi(data);
    } catch {
      // fall through — use auth payload if present
    }
  }

  if (!profile && payload.user) {
    profile = parseUserFromApi(payload.user);
  }

  if (!profile) {
    throw new Error("Could not load user profile");
  }

  await persistAuthSession(
    {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      user: { name: profile.name, email: profile.email },
    },
    profile.role,
  );
}
