"use client";

import { createContext, useContext } from "react";

import { useCurrentUser } from "@/hooks/user/use-current-user";
import { User } from "@/types";

type UserContextType = {
  user: User | null | undefined;
  isUserLoading: boolean;
};

const UserContext = createContext({} as UserContextType);

export const useUserContext = () => {
  const ctx = useContext(UserContext);

  if (!ctx) {
    throw new Error("[useUserContext] must be used within a UserProvider");
  }

  return ctx;
};

// migrate user request to react-query
const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { data, isPending } = useCurrentUser();

  return (
    <UserContext.Provider
      value={{
        user: data,
        isUserLoading: isPending,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
