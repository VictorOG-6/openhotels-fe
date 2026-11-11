import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatToNaira(amount: number): string {
  if (isNaN(amount)) {
    throw new Error("Invalid number provided");
  }

  // Create a new NumberFormat object for Nigerian Naira without decimal places
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // Format the amount
  return formatter.format(amount);
}

const AVATAR_COLORS = [
  { backgroundColor: "#E53935", color: "#FFFFFF" },
  { backgroundColor: "#D81B60", color: "#FFFFFF" },
  { backgroundColor: "#8E24AA", color: "#FFFFFF" },
  { backgroundColor: "#5E35B1", color: "#FFFFFF" },
  { backgroundColor: "#3949AB", color: "#FFFFFF" },
  { backgroundColor: "#1E88E5", color: "#FFFFFF" },
  { backgroundColor: "#039BE5", color: "#FFFFFF" },
  { backgroundColor: "#00897B", color: "#FFFFFF" },
  { backgroundColor: "#43A047", color: "#FFFFFF" },
  { backgroundColor: "#F4511E", color: "#FFFFFF" },
  { backgroundColor: "#FB8C00", color: "#FFFFFF" },
  { backgroundColor: "#6D4C41", color: "#FFFFFF" },
] as const;

function hashString(input: string): number {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = input.charCodeAt(index) + ((hash << 5) - hash);
  }

  return Math.abs(hash);
}

export function getAvatarColors(seed: string) {
  const normalizedSeed = seed.trim().toLowerCase() || "guest";
  const index = hashString(normalizedSeed) % AVATAR_COLORS.length;

  return AVATAR_COLORS[index];
}

export function getInitials(name: string, maxLength = 2): string {
  if (!name?.trim()) return "";

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";

  if (parts.length === 1) {
    return parts[0].slice(0, maxLength).toUpperCase();
  }

  if (maxLength === 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }

  return parts
    .slice(0, maxLength)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
