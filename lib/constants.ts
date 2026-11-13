function withoutTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

export const API_URL = withoutTrailingSlash(process.env.NEXT_PUBLIC_API_URL ?? "");

/** Absolute backend URL for a path like `/auth/google`. */
export function buildApiUrl(path: string) {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${suffix}`;
}

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL as string;
export const FORM_API = process.env.NEXT_PUBLIC_FORMSPREE_API as string;
