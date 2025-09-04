import { createContext, useContext, useState, useCallback } from "react";

const LoadingContext = createContext();
export function LoadingProvider({ children }) {
  const [count, setCount] = useState(0);
  const inc = useCallback(() => setCount(c => c + 1), []);
  const dec = useCallback(() => setCount(c => Math.max(0, c - 1)), []);
  return (
    <LoadingContext.Provider value={{ count, inc, dec }}>
      {children}
    </LoadingContext.Provider>
  );
}

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return ctx;
};
