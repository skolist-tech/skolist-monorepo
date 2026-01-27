// import { useEffect } from "react";
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
    </Routes>
  );
}

export default App;
