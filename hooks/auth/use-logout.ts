import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { $http, removeAccessTokenFromHttpInstance } from "@/lib/http";

export const useLogout = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const clearClientAuth = () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user_display");
    removeAccessTokenFromHttpInstance();
  };

  const logout = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // Backend should read refresh token from httpOnly cookie
      await $http.post("/auth/logout");

      // Clear httpOnly cookies via Next.js route
      await fetch("/api/auth/session", {
        method: "DELETE",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Always clear client state
      clearClientAuth();

      router.push("/sign-in");
      router.refresh();

      setIsLoading(false);
    }
  }, [isLoading, router]);

  return { logout, isLoading };
};
