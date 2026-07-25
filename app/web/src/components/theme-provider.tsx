"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>({ theme: "light", setTheme: () => {} });
const validThemes: Theme[] = ["light", "dark"];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => { if (typeof window === "undefined") return "light"; const saved = window.localStorage.getItem("sv_theme"); return validThemes.includes(saved as Theme) ? saved as Theme : "light"; });
  useEffect(() => { document.documentElement.dataset.theme = theme; window.localStorage.setItem("sv_theme", theme); }, [theme]);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
