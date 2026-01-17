import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Theme = "amber" | "sage" | "ocean" | "rose" | "slate" | "lavender";

export const themes: { id: Theme; name: string; color: string }[] = [
  { id: "amber", name: "Amber", color: "#db8550" },
  { id: "sage", name: "Sage", color: "#788862" },
  { id: "ocean", name: "Ocean", color: "#3494a3" },
  { id: "rose", name: "Rose", color: "#dd5c5c" },
  { id: "slate", name: "Slate", color: "#687790" },
  { id: "lavender", name: "Lavender", color: "#a17fcc" },
];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "recipe-app-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && themes.some((t) => t.id === saved)) {
        return saved as Theme;
      }
    }
    return "amber";
  });

  useEffect(() => {
    // Apply theme to document
    if (theme === "amber") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
