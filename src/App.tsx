import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { authEvents } from "@/config/api";
import IndexPage from "@/pages/index";
import ProjectPage from "@/pages/project";
import SigninPage from "@/pages/signin";
import SignupPage from "@/pages/signup";
import ForgotPasswordPage from "./pages/forgot-password";
import ResetPasswordPage from "./pages/reset-password";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = () => {
      localStorage.removeItem("token");
      navigate("/signin", { replace: true });
    };

    authEvents.addEventListener("unauthorized", logout);
    return () => authEvents.removeEventListener("unauthorized", logout);
  }, [navigate]);

  function RootRoute() {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      return <Navigate to="/signin" replace />;
    }
    return <IndexPage />;
  }

  return (
    <Routes>
      <Route element={<RootRoute />} path="/" />
      <Route element={<ProjectPage />} path=":projectId" />
      <Route element={<SigninPage />} path="/signin" />
      <Route element={<SignupPage />} path="/signup" />
      <Route element={<ForgotPasswordPage />} path="/forgot-password" />
      <Route element={<ResetPasswordPage />} path="/reset-password" />
    </Routes>
  );
}

export default App;
