import type { FieldErrors, FieldValues } from "react-hook-form";

export function getFirstFieldErrorMessage<T extends FieldValues>(
  errors: FieldErrors<T>,
): string | undefined {
  for (const value of Object.values(errors)) {
    if (!value) continue;
    if ("message" in value && typeof value.message === "string") {
      return value.message;
    }
    const nested = getFirstFieldErrorMessage(
      value as FieldErrors<FieldValues>,
    );
    if (nested) return nested;
  }
  return undefined;
}
