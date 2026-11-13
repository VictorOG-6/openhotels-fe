"use client";

import { useQuery } from "@tanstack/react-query";
import { $http } from "@/lib/http";
import { getClientAccessToken } from "@/lib/client-session";
import { userKeys } from "@/lib/react-query/query-keys";
import { parseFullUserFromApi } from "@/lib/user-response";
import { User } from "@/types";

const fetchCurrentUser = async (): Promise<User | null> => {
  const accessToken = await getClientAccessToken();
  if (!accessToken) return null;

  const { data } = await $http.get("/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return parseFullUserFromApi(data);
};

export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
