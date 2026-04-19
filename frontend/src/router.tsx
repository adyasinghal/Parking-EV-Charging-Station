import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/routing/ProtectedRoute";
import RoleRoute from "./components/routing/RoleRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import LandingPage from "./pages/landing/LandingPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ZonesPage from "./pages/zones/ZonesPage";
import ZoneDetailPage from "./pages/zones/ZoneDetailPage";
import ReservationsPage from "./pages/reservations/ReservationsPage";
import NewReservationPage from "./pages/reservations/NewReservationPage";
import ReservationDetailPage from "./pages/reservations/ReservationDetailPage";
import ChargersPage from "./pages/charging/ChargersPage";
import ChargerDetailPage from "./pages/charging/ChargerDetailPage";
import WalletPage from "./pages/wallet/WalletPage";
import VehiclesPage from "./pages/vehicles/VehiclesPage";
import SessionsPage from "./pages/sessions/SessionsPage";
import UsersPage from "./pages/admin/UsersPage";
import UserDetailPage from "./pages/admin/UserDetailPage";
import MaintenancePage from "./pages/admin/MaintenancePage";
import TopupRequestsPage from "./pages/admin/TopupRequestsPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import PricingPage from "./pages/admin/PricingPage";
import AdminBillingPage from "./pages/admin/AdminBillingPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/zones" element={<ZonesPage />} />
          <Route path="/zones/:id" element={<ZoneDetailPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/reservations/new" element={<NewReservationPage />} />
          <Route path="/reservations/:id" element={<ReservationDetailPage />} />
          <Route path="/chargers" element={<ChargersPage />} />
          <Route path="/chargers/:id" element={<ChargerDetailPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/sessions" element={<SessionsPage />} />

          <Route element={<RoleRoute allowed={["Admin"]} />}>
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/users/:id" element={<UserDetailPage />} />
            <Route path="/admin/maintenance" element={<MaintenancePage />} />
            <Route path="/admin/topup-requests" element={<TopupRequestsPage />} />
            <Route path="/admin/billing" element={<AdminBillingPage />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
            <Route path="/admin/pricing" element={<PricingPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
