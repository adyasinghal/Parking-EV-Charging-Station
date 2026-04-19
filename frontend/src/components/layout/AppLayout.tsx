import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

type NavItem = {
  to: string;
  label: string;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/zones", label: "Zones" },
  { to: "/reservations", label: "Reservations" },
  { to: "/chargers", label: "Chargers" },
  { to: "/wallet", label: "Wallet" },
  { to: "/vehicles", label: "Vehicles" },
  { to: "/sessions", label: "Sessions" },
  { to: "/admin/users", label: "Users", adminOnly: true },
  { to: "/admin/maintenance", label: "Maintenance", adminOnly: true },
  { to: "/admin/topup-requests", label: "Topup Requests", adminOnly: true },
  { to: "/admin/billing", label: "Billing", adminOnly: true },
  { to: "/admin/pricing", label: "Pricing", adminOnly: true },
  { to: "/admin/analytics", label: "Analytics", adminOnly: true },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Operations Dashboard",
  "/zones": "Parking Zones",
  "/reservations": "Reservations",
  "/chargers": "EV Chargers",
  "/wallet": "Wallet & Billing",
  "/vehicles": "Vehicle Profiles",
  "/sessions": "Charging Sessions",
  "/admin/users": "User Management",
  "/admin/maintenance": "Maintenance",
  "/admin/topup-requests": "Topup Requests",
  "/admin/billing": "Admin Billing",
  "/admin/pricing": "Pricing Rules",
  "/admin/analytics": "Analytics",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/reservations/")) return "Reservation Details";
  if (pathname.startsWith("/chargers/")) return "Charger Details";
  if (pathname.startsWith("/admin/users/")) return "User Details";
  return "VoltPark";
}

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-mark">
          <div className="brand-glow">V</div>
          VoltPark
        </div>
        <p className="sidebar-caption">Parking &amp; EV operations</p>
        <nav className="sidebar-nav">
          {navItems
            .filter((item) => !item.adminOnly || user?.role === "Admin")
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "nav-link nav-link-active" : "nav-link")}
              >
                {item.label}
              </NavLink>
            ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1 style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 500, letterSpacing: "-0.025em" }}>
              {getPageTitle(location.pathname)}
            </h1>
          </div>
          <div className="user-actions">
            <div>
              <strong>{user?.full_name}</strong>
              <p>{user?.role}</p>
            </div>
            <button className="button-secondary" onClick={onLogout}>Logout</button>
          </div>
        </header>
        <main className="page-wrap">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
