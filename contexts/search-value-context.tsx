"use client";

import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from "react";

type SearchValueContextType = {
  globalSearchValue: string;
  setGlobalSearchValue: (value: string) => void;
};

const SearchValueContext = createContext({} as SearchValueContextType);

export const useSearchValueContext = () => {
  const ctx = useContext(SearchValueContext);

  if (!ctx) {
    throw new Error(
      "[useSearchValue] must be used within a SearchValueProvider",
    );
  }

  return ctx;
};

const SearchValueProvider = ({ children }: { children: React.ReactNode }) => {
  const [globalSearchValue, setGlobalSearchValue] = useState("");

  const value = {
    globalSearchValue,
    setGlobalSearchValue,
  };

  return (
    <SearchValueContext.Provider value={value}>
      {children}
    </SearchValueContext.Provider>
  );
};

export default SearchValueProvider;
