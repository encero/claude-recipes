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
  KeyRound,
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useTheme } from "../context/ThemeContext";
import { themes } from "../context/themes";

export function Layout() {
  const { signOut } = useAuthActions();
  const changePin = useMutation(api.users.changePin);
  const { theme, setTheme } = useTheme();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    setPinSuccess(false);

    if (newPin !== confirmPin) {
      setPinError("New PINs do not match");
      return;
    }

    if (newPin.length < 4) {
      setPinError("PIN must be at least 4 characters");
      return;
    }

    setIsChangingPin(true);
    try {
      await changePin({ currentPin, newPin });
      setPinSuccess(true);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setTimeout(() => {
        setShowPinModal(false);
        setPinSuccess(false);
      }, 1500);
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Failed to change PIN");
    } finally {
      setIsChangingPin(false);
    }
  };

  const closePinModal = () => {
    setShowPinModal(false);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setPinError("");
    setPinSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-xl font-bold text-primary-600">Family Recipes</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowPinModal(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Change PIN"
          >
            <KeyRound className="w-5 h-5" />
          </button>
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
      <main className="flex-1 overflow-auto pb-16 md:pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 md:px-4 md:py-2 z-50">
        <div className="max-w-lg mx-auto flex justify-around">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-2 md:py-2 md:px-4 rounded-lg transition-colors ${
                isActive
                  ? "text-primary-600 bg-primary-50"
                  : "text-gray-500 hover:text-gray-700"
              }`
            }
          >
            <UtensilsCrossed className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-xs mt-0.5 md:mt-1 font-medium hidden sm:inline">Recipes</span>
          </NavLink>
          <NavLink
            to="/planner"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-2 md:py-2 md:px-4 rounded-lg transition-colors ${
                isActive
                  ? "text-primary-600 bg-primary-50"
                  : "text-gray-500 hover:text-gray-700"
              }`
            }
          >
            <CalendarDays className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-xs mt-0.5 md:mt-1 font-medium hidden sm:inline">Planner</span>
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-2 md:py-2 md:px-4 rounded-lg transition-colors ${
                isActive
                  ? "text-primary-600 bg-primary-50"
                  : "text-gray-500 hover:text-gray-700"
              }`
            }
          >
            <History className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-xs mt-0.5 md:mt-1 font-medium hidden sm:inline">History</span>
          </NavLink>
        </div>
      </nav>

      {/* Theme Modal */}
      {showThemeModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4"
          onClick={() => setShowThemeModal(false)}
        >
          <div 
            className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* Change PIN Modal */}
      {showPinModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4"
          onClick={closePinModal}
        >
          <div 
            className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Change PIN</h3>
              <button
                onClick={closePinModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {pinSuccess ? (
              <div className="flex flex-col items-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-green-600 font-medium">PIN changed successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleChangePin} className="space-y-4">
                <div>
                  <label
                    htmlFor="currentPin"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Current PIN
                  </label>
                  <input
                    id="currentPin"
                    type="password"
                    inputMode="numeric"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow text-center text-xl tracking-widest"
                    placeholder="••••"
                  />
                </div>

                <div>
                  <label
                    htmlFor="newPin"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    New PIN
                  </label>
                  <input
                    id="newPin"
                    type="password"
                    inputMode="numeric"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    required
                    minLength={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow text-center text-xl tracking-widest"
                    placeholder="••••"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmNewPin"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm New PIN
                  </label>
                  <input
                    id="confirmNewPin"
                    type="password"
                    inputMode="numeric"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    required
                    minLength={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow text-center text-xl tracking-widest"
                    placeholder="••••"
                  />
                </div>

                {pinError && (
                  <div className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">
                    {pinError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isChangingPin}
                  className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPin ? "Changing..." : "Change PIN"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
