import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  UtensilsCrossed,
  CalendarDays,
  History,
  LogOut,
  Palette,
  Check,
  X,
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useTheme, themes } from "../context/ThemeContext";

export function Layout() {
  const { signOut } = useAuthActions();
  const { theme, setTheme } = useTheme();
  const [showThemeModal, setShowThemeModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-xl font-bold text-primary-600">Family Recipes</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowThemeModal(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Change theme"
          >
            <Palette className="w-5 h-5" />
          </button>
          <button
            onClick={() => signOut()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="max-w-lg mx-auto flex justify-around">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                isActive
                  ? "text-primary-600 bg-primary-50"
                  : "text-gray-500 hover:text-gray-700"
              }`
            }
          >
            <UtensilsCrossed className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Recipes</span>
          </NavLink>
          <NavLink
            to="/planner"
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                isActive
                  ? "text-primary-600 bg-primary-50"
                  : "text-gray-500 hover:text-gray-700"
              }`
            }
          >
            <CalendarDays className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Planner</span>
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                isActive
                  ? "text-primary-600 bg-primary-50"
                  : "text-gray-500 hover:text-gray-700"
              }`
            }
          >
            <History className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">History</span>
          </NavLink>
        </div>
      </nav>

      {/* Theme Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Choose Theme</h3>
              <button
                onClick={() => setShowThemeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setShowThemeModal(false);
                  }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    theme === t.id
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: t.color }}
                  >
                    {theme === t.id && <Check className="w-5 h-5 text-white" />}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {t.name}
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-4 text-xs text-gray-500 text-center">
              Theme is saved automatically
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
