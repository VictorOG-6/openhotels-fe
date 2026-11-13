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

/** Full `/user` record for client-side queries (e.g. current user). */
export function parseFullUserFromApi(body: unknown): User | null {
  const candidate = unwrapUserRecord(body);
  if (!candidate) return null;

  const { id, created_at, updated_at, name, email } = candidate;
  if (
    typeof id !== "string" ||
    typeof created_at !== "string" ||
    typeof updated_at !== "string" ||
    typeof name !== "string" ||
    typeof email !== "string"
  ) {
    return null;
  }

  const role = isUserRole(candidate.role) ? candidate.role : "user";

  const profile_image_url =
    typeof candidate.profile_image_url === "string"
      ? candidate.profile_image_url
      : "";

  const total_bookings =
    typeof candidate.total_bookings === "number" ? candidate.total_bookings : 0;
  const total_spent =
    typeof candidate.total_spent === "number" ? candidate.total_spent : 0;

  return {
    id,
    created_at,
    updated_at,
    name,
    email,
    role,
    profile_image_url,
    total_bookings,
    total_spent,
  };
}
