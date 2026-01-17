import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UtensilsCrossed } from "lucide-react";

// Hardcoded email for single-user local deployment
export const HARDCODED_EMAIL = "family@recipes.local";

export function AuthPage() {
  const { signIn } = useAuthActions();
  const userCheck = useQuery(api.users.getUserByEmail, { email: HARDCODED_EMAIL });
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isSetupMode = userCheck?.exists === false;
  const isCheckingUser = userCheck === undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSetupMode) {
      if (pin !== confirmPin) {
        setError("PINs do not match.");
        return;
      }
      if (pin.length < 4) {
        setError("PIN must be at least 4 characters.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", HARDCODED_EMAIL);
      formData.append("password", pin);
      formData.append("flow", isSetupMode ? "signUp" : "signIn");

      const result = await signIn("password", formData);
      console.log("Sign in result:", result);
    } catch (err) {
      console.error("Sign in error:", err);
      setError(
        isSetupMode
          ? "Failed to create account. Please try again."
          : "Invalid PIN. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Family Recipes</h1>
            <p className="text-gray-500 mt-1">
              {isCheckingUser
                ? "Loading..."
                : isSetupMode
                  ? "Set up your PIN to get started"
                  : "Your family's meal companion"}
            </p>
          </div>

          {isCheckingUser ? (
            <div className="flex justify-center py-8">
              <svg
                className="animate-spin h-8 w-8 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="pin"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {isSetupMode ? "Create PIN" : "Enter PIN"}
                </label>
                <input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                  minLength={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow text-center text-2xl tracking-widest"
                  placeholder="••••"
                  autoFocus
                />
              </div>

              {isSetupMode && (
                <div>
                  <label
                    htmlFor="confirmPin"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm PIN
                  </label>
                  <input
                    id="confirmPin"
                    type="password"
                    inputMode="numeric"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    required
                    minLength={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow text-center text-2xl tracking-widest"
                    placeholder="••••"
                  />
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Please wait...
                  </span>
                ) : isSetupMode ? (
                  "Create Account"
                ) : (
                  "Unlock"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
