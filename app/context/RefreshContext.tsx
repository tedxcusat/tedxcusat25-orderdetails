"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface RefreshContextType {
  refreshHandler: (() => Promise<void> | void) | null;
  setRefreshHandler: (handler: (() => Promise<void> | void) | null) => void;
  isRefreshing: boolean;
  setIsRefreshing: (loading: boolean) => void;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [refreshHandler, setRefreshHandlerState] = useState<(() => Promise<void> | void) | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const setRefreshHandler = (handler: (() => Promise<void> | void) | null) => {
    setRefreshHandlerState(() => handler);
  };

  return (
    <RefreshContext.Provider value={{ refreshHandler, setRefreshHandler, isRefreshing, setIsRefreshing }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error("useRefresh must be used within a RefreshProvider");
  }
  return context;
}
