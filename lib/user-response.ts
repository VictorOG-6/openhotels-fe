import type { User, UserRole } from "@/types";

/** User fields required to establish a session after auth. */
export type UserProfile = Pick<User, "name" | "email" | "role">;

const isUserRole = (value: unknown): value is UserRole =>
  value === "admin" || value === "staff" || value === "user";

export function unwrapUserRecord(
  body: unknown,
): Record<string, unknown> | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;
  if (record.user && typeof record.user === "object") {
    return record.user as Record<string, unknown>;
  }

  return record;
}

/**
 * Normalizes `/user` and auth payloads ({ user, access_token, ... }).
 */
export function parseUserFromApi(body: unknown): UserProfile | null {
  const candidate = unwrapUserRecord(body);
  if (!candidate) return null;

  const name = candidate.name;
  const email = candidate.email;
  if (typeof name !== "string" || typeof email !== "string") {
    return null;
  }

  const role = isUserRole(candidate.role) ? candidate.role : "user";

  return { name, email, role };
}
