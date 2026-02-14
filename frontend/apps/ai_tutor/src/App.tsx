import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@skolist/auth";
import { Layout } from "./components/layout";
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
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        {/* Add more protected routes here */}
      </Route>
    </Routes>
  );
}

export default App;
