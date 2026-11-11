import { jwtDecode } from "jwt-decode";
import type { UserRole } from "@/types";

interface DecodedToken {
  exp: number;
  userId: string;
  [key: string]: unknown;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
  role: UserRole;
}

export interface AuthPayload {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

type AuthResponse = AuthPayload | { data?: AuthPayload };

export const getAuthPayload = (response: AuthResponse): AuthPayload => {
  const payload =
    "access_token" in response && response.access_token
      ? response
      : "data" in response
        ? response.data
        : undefined;

  if (!payload?.access_token || !payload.refresh_token) {
    throw new Error("Invalid authentication response");
  }

  return payload;
};

/**
 * Securely store authentication token
 * Uses httpOnly cookies for web (most secure) or encrypted storage for mobile
 */
export const storeAuthToken = async (
  accessToken: string,
  refreshToken: string,
  role?: UserRole,
): Promise<void> => {
  try {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, refreshToken, role }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to create session");
    }
  } catch (error) {
    console.error("Failed to store auth token:", error);
    throw new Error("Session storage failed");
  }
};

/**
 * Validate JWT token before storing
 */
export const validateToken = (token: string): DecodedToken => {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Math.floor(Date.now() / 1000);

    if (decoded.exp <= currentTime) {
      throw new Error("Token is expired");
    }

    return decoded;
  } catch (error) {
    console.error("Token validation failed:", error);
    throw new Error("Invalid token");
  }
};
