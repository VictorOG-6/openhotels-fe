// hooks/useTokenRefresh.ts
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface RefreshTokenResponse {
  success: boolean;
  access_token?: string;
  token_type?: string;
  error?: string;
}

/**
 * Hook to handle token refresh
 */
export const useTokenRefresh = () => {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (isRefreshing) {
      // Prevent multiple simultaneous refresh attempts
      return null;
    }

    setIsRefreshing(true);

    try {
      const response = await fetch("/api/auth/refresh-token", {
        method: "POST",
        credentials: "include", // Important for cookies
      });

      if (!response.ok) {
        // Refresh failed - likely token expired or revoked
        console.error("Token refresh failed:", response.status);

        // Redirect to login
        router.push("/sign-in");
        return null;
      }

      const data: RefreshTokenResponse = await response.json();

      if (!data.success || !data.access_token) {
        router.push("/sign-in");
        return null;
      }

      // Return new access token
      return data.access_token;
    } catch (error) {
      console.error("Token refresh error:", error);
      router.push("/sign-in");
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, router]);

  return { refreshToken, isRefreshing };
};
