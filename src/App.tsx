import { useConvexAuth } from "convex/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { RecipesPage } from "./pages/RecipesPage";
import { RecipeDetailPage } from "./pages/RecipeDetailPage";
import { PlannerPage } from "./pages/PlannerPage";
import { HistoryPage } from "./pages/HistoryPage";
import { Layout } from "./components/Layout";

function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </>
        ) : (
          <>
            <Route element={<Layout />}>
              <Route path="/" element={<RecipesPage />} />
              <Route path="/recipe/:id" element={<RecipeDetailPage />} />
              <Route path="/planner" element={<PlannerPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
