"use client";

import { useQuery } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";
import { $http, addAccessTokenToHttpInstance } from "@/lib/http";
import { userKeys } from "@/lib/react-query/query-keys";
import { User } from "@/types";

const isTokenValid = (token: string) => {
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    return decoded.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
};

const getAccessToken = async () => {
  const existingToken = sessionStorage.getItem("access_token");
  if (existingToken && isTokenValid(existingToken)) return existingToken;

  const response = await fetch("/api/auth/refresh-token", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    success?: boolean;
    access_token?: string;
  };

  if (!data.success || !data.access_token) return null;

  sessionStorage.setItem("access_token", data.access_token);
  addAccessTokenToHttpInstance(data.access_token);

  return data.access_token;
};

const fetchCurrentUser = async (): Promise<User | null> => {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const { data } = await $http.get<User>("/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
};

export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
