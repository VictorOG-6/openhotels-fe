"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { $http } from "@/lib/http";
import { userKeys } from "@/lib/react-query/query-keys";
import { User, UserFetchProps } from "@/types";

const useFetchUsers = ({
  page_size = 20,
  page = 1,
  name,
  email,
  role,
}: UserFetchProps) => {
  return useQuery({
    queryKey: userKeys.list({ page_size, page, name, email, role }),
    queryFn: async () => {
      const response = await $http.get("/user/all", {
        params: {
          page_size: page_size,
          page: page,
          name: name || undefined,
          email: email || undefined,
          role: role || undefined,
        },
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
};

export default useFetchUsers;
