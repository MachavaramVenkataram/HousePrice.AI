"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type UserMode = "simple" | "expert";

interface ModeContextType {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  toggleMode: () => void;
  isExpert: boolean;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<UserMode>("simple");

  useEffect(() => {
    const saved = localStorage.getItem("houseprice_ai_mode") as UserMode | null;
    if (saved === "simple" || saved === "expert") {
      setModeState(saved);
    }
  }, []);

  const setMode = (newMode: UserMode) => {
    setModeState(newMode);
    localStorage.setItem("houseprice_ai_mode", newMode);
  };

  const toggleMode = () => {
    setMode(mode === "simple" ? "expert" : "simple");
  };

  return (
    <ModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        isExpert: mode === "expert",
      }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useUserMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error("useUserMode must be used within a ModeProvider");
  }
  return context;
}
