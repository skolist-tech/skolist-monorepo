import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@skolist/auth";
import { DashboardPage } from "./pages/dashboard";
import { LoginPage } from "./pages/login";

function App() {
  return (
    <Routes>
      {/* Public route - Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/bank-management"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <BankManagementPage />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

// Simple Admin Check Wrapper
import { useAuth, getSupabaseClient } from "@skolist/auth";
import { Navigate } from "react-router-dom";
import BankManagementPage from "./pages/BankManagementPage";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

function AdminRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from("users")
          .select("user_type")
          .eq("id", user.id)
          .single();

        if (error || !data) {
          console.error("Error fetching user profile:", error);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(data.user_type === "skolist-admin");
      } catch (err) {
        console.error("Failed to check admin status:", err);
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [user]);

  if (isAdmin === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default App;
