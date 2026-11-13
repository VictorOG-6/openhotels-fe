import { storeAuthToken, validateToken } from "@/lib/auth";
import { addAccessTokenToHttpInstance } from "@/lib/http";

type SessionUser = {
  name: string;
  email: string;
};

export async function persistAuthSession(tokens: {
  access_token: string;
  refresh_token: string;
  user: SessionUser;
}) {
  validateToken(tokens.access_token);
  await storeAuthToken(tokens.access_token, tokens.refresh_token);

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
