const STORAGE_KEY = "openhotels.prebooks";
const MAX_ITEMS = 20;
const VISIBLE_MS = 24 * 60 * 60 * 1000;

export type StoredPrebook = {
  prebookId: string;
  hotelName?: string;
  roomName?: string;
  price?: number;
  currency?: string;
  checkin?: string;
  checkout?: string;
  createdAt: string;
  status: "pending" | "booked";
};

export function isPrebookId(value: string) {
  return /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

export function listPendingPrebooks() {
  return readAll().filter((item) => item.status === "pending" && isRecent(item));
}

export function findPrebook(prebookId: string) {
  return readAll().find((item) => item.prebookId === prebookId);
}

export function rememberPrebook(
  entry: Omit<StoredPrebook, "createdAt" | "status"> & {
    createdAt?: string;
    status?: StoredPrebook["status"];
  },
) {
  const prebookId = entry.prebookId.trim();
  if (!isPrebookId(prebookId)) return;
  const next: StoredPrebook = {
    ...entry,
    prebookId,
    createdAt: entry.createdAt ?? new Date().toISOString(),
    status: entry.status ?? "pending",
  };
  const rest = readAll().filter((item) => item.prebookId !== prebookId);
  write([next, ...rest].slice(0, MAX_ITEMS));
}

export function markPrebookBooked(prebookId: string) {
  write(
    readAll().map((item) =>
      item.prebookId === prebookId ? { ...item, status: "booked" as const } : item,
    ),
  );
}

function isRecent(item: StoredPrebook) {
  const created = Date.parse(item.createdAt);
  if (!Number.isFinite(created)) return false;
  return Date.now() - created < VISIBLE_MS;
}

function readAll(): StoredPrebook[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredPrebook);
  } catch {
    return [];
  }
}

function write(items: StoredPrebook[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Private mode can block storage. The guest can still open a prebook by id.
  }
}

function isStoredPrebook(value: unknown): value is StoredPrebook {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<StoredPrebook>;
  return (
    typeof record.prebookId === "string" &&
    isPrebookId(record.prebookId) &&
    typeof record.createdAt === "string" &&
    (record.status === "pending" || record.status === "booked")
  );
}
