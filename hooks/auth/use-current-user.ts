// hooks/useCurrentUser.ts - Get current user from token
import { useMemo } from "react";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
  user_id: string;
  sub: string;
  jti: string;
}

interface UserDisplayData {
  firstName: string;
  lastName: string;
  email: string;
}

export const useCurrentUser = () => {
  const userData = useMemo(() => {
    try {
      const token = sessionStorage.getItem("access_token");
      if (!token) return null;

      const decoded = jwtDecode<DecodedToken>(token);

      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp <= currentTime) {
        return null;
      }

      const displayData = sessionStorage.getItem("user_display");
      const display: UserDisplayData = displayData
        ? JSON.parse(displayData)
        : { firstName: "", lastName: "", email: decoded.sub };

      return {
        userId: decoded.user_id,
        email: decoded.sub,
        firstName: display.firstName,
        lastName: display.lastName,
      };
    } catch {
      return null;
    }
  }, []);

  return userData;
};
