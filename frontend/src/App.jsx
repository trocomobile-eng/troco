import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import SplashScreen from "./components/SplashScreen";
import LandingPage from "./pages/LandingPage";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import FeedPage from "./pages/FeedPage";
import ItemDetailPage from "./pages/ItemDetailPage";
import AddItemPage from "./pages/AddItemPage";
import ProposeExchangePage from "./pages/ProposeExchangePage";
import ExchangesPage from "./pages/ExchangesPage";
import ExchangeDetailPage from "./pages/ExchangeDetailPage";
import ProfilePage from "./pages/ProfilePage";
import UserItemsPage from "./pages/UserItemsPage";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  return !user ? children : <Navigate to="/feed" replace />;
}

function AppRoutes() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <SplashScreen show={showSplash} />

      <BrowserRouter>
        <div className="max-w-lg mx-auto min-h-screen">
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignupPage />
                </PublicRoute>
              }
            />

            <Route path="/feed" element={<FeedPage />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />

            <Route
              path="/add"
              element={
                <PrivateRoute>
                  <AddItemPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/propose/:itemId"
              element={
                <PrivateRoute>
                  <ProposeExchangePage />
                </PrivateRoute>
              }
            />

            <Route
              path="/exchanges"
              element={
                <PrivateRoute>
                  <ExchangesPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/exchanges/:id"
              element={
                <PrivateRoute>
                  <ExchangeDetailPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />

            <Route
              path="/user/:id"
              element={
                <PrivateRoute>
                  <UserItemsPage />
                </PrivateRoute>
              }
            />

          </Routes>
        </div>
      </BrowserRouter>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
