import { useAuth } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import GoogleDashboardPage from "./pages/GoogleDashboardPage";
import GuidePage from "./pages/GuidePage";

export default function App() {
  const { user } = useAuth();
  const path = window.location.pathname;

  if (path === "/login") {
    if (user) {
      window.location.href = user.role === "admin" ? "/admin" : "/dashboard";
      return null;
    }
    return <LoginPage />;
  }

  if (path === "/admin" || path.startsWith("/admin/")) {
    if (!user) { window.location.href = "/login"; return null; }
    if (user.role !== "admin") { window.location.href = "/dashboard"; return null; }
    return <AdminPage />;
  }

  if (path === "/dashboard/google") {
    if (!user) { window.location.href = "/login"; return null; }
    return <GoogleDashboardPage />;
  }

  if (path === "/guide") {
    if (!user) { window.location.href = "/login"; return null; }
    return <GuidePage />;
  }

  if (path === "/dashboard" || path.startsWith("/dashboard/")) {
    if (!user) { window.location.href = "/login"; return null; }
    return <DashboardPage />;
  }

  return <HomePage />;
}
