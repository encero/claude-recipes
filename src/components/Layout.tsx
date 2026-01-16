import { Outlet, NavLink } from "react-router-dom";
import {
  UtensilsCrossed,
  CalendarDays,
  History,
  LogOut,
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

export function Layout() {
  const { signOut } = useAuthActions();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-xl font-bold text-primary-600">Family Recipes</h1>
        <button
          onClick={() => signOut()}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
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
    </div>
  );
}
