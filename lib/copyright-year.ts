export async function getCopyrightYear() {
  "use cache";

  return new Date().getFullYear();
}
