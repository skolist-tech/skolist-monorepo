// import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@skolist/auth";
import { DashboardPage } from "./pages/dashboard";
import { LoginPage } from "./pages/login";

function App() {
  // // Dynamic viewport scaling for different screen sizes
  // // Only applies to laptops/desktops, not mobile/tablet
  // useEffect(() => {
  //   const targetWidth = 1908; // Reference screen width (your screen)
  //   const minWidthForScaling = 1024; // Don't scale below this (tablets/phones)

  //   const applyScaling = () => {
  //     const currentWidth = window.innerWidth;
  //     // Only apply scaling for laptop/desktop screens
  //     if (currentWidth >= minWidthForScaling && currentWidth < targetWidth) {
  //       const scale = currentWidth / targetWidth;
  //       document.body.style.zoom = `${scale}`;
  //     } else {
  //       document.body.style.zoom = "1";
  //     }
  //   };

  //   // Apply on mount
  //   applyScaling();

  //   // Apply on resize
  //   window.addEventListener("resize", applyScaling);
  //   return () => window.removeEventListener("resize", applyScaling);
  // }, []);

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
