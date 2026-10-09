import { useEffect, useState } from "react";
import {
  Bell,
  CarFront,
  ChartNoAxesCombined,
  ClipboardList,
  FileText,
  IdCard,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { connectRealtime } from "../../services/realtime";
import { useAuthStore } from "../../store/authStore";

const vendorSections = [
  {
    label: "VENDOR",
    links: [
      ["/", "Dashboard", LayoutDashboard],
      ["/vehicles", "My Fleet", CarFront],
      ["/bookings", "Bookings", ClipboardList],
      ["/earnings", "Earnings", IndianRupee],
      ["/documents", "Documents", FileText],
      ["/profile", "Profile", UserCircle],
      ["/settings", "Settings", Settings],
    ],
  },
];

const adminLinks = [
  ["/", "Overview", LayoutDashboard],
  ["/admin/users", "Users", Users],
  ["/admin/vendors", "Vendors", ShieldCheck],
  ["/admin/drivers", "Drivers", IdCard],
  ["/admin/bookings", "Assignments", ClipboardList],
  ["/admin/vehicles", "Vehicles", CarFront],
  ["/admin/reviews", "Reviews", ClipboardList],
  ["/reports", "Reports", ClipboardList],
  ["/analytics", "Analytics", ChartNoAxesCombined],
];

export function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";

  useEffect(
    () =>
      connectRealtime(token, (notification) => {
        setToast(notification);
        window.setTimeout(() => setToast(null), 4500);
      }),
    [token],
  );

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
        <div className="brand">
          <span>
            <CarFront />
          </span>
          <div>
            SmartRide<small>Move smarter</small>
          </div>
          <button className="mobile-close" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>

        {!isAdmin && (
          <div className="sidebar-vendor-info">
            <div className="sidebar-vendor-info__avatar">
              {user?.name?.[0]?.toUpperCase() || "V"}
            </div>
            <div>
              <div className="sidebar-vendor-info__name">
                {user?.name || "Vendor"}
              </div>
              <div className="sidebar-vendor-info__role">Vendor</div>
            </div>
          </div>
        )}

        <nav>
          {isAdmin ? (
            adminLinks.map(([to, label, Icon]) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => setOpen(false)}
              >
                <Icon size={19} />
                {label}
              </NavLink>
            ))
          ) : (
            vendorSections.map((section) => (
              <div key={section.label}>
                <span className="sidebar-section-label">{section.label}</span>
                {section.links.map(([to, label, Icon]) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    onClick={() => setOpen(false)}
                  >
                    <Icon size={19} />
                    {label}
                  </NavLink>
                ))}
              </div>
            ))
          )}
        </nav>

        {!isAdmin && (
          <div style={{ marginTop: "auto", paddingBottom: "8px" }}>
            <span className="sidebar-section-label">SWITCH ROLE</span>
            <span className="sidebar-switch-link">
              <Users size={16} /> Customer
            </span>
            <span className="sidebar-switch-link">
              <IdCard size={16} /> Driver
            </span>
            <span className="sidebar-switch-link">
              <ShieldCheck size={16} /> Admin
            </span>
          </div>
        )}

        <div className="sidebar-footer">
          <div className="sidebar-footer__avatar">
            {user?.name?.[0]?.toUpperCase() || "S"}
          </div>
          <div>
            <div className="sidebar-footer__name">{user?.name || "Vendor"}</div>
            <div className="sidebar-footer__role">{user?.role}</div>
          </div>
        </div>

        <button
          className="logout"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <LogOut size={18} /> Sign out
        </button>
      </aside>

      {open && <button className="backdrop" onClick={() => setOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div>
            <small>Workspace</small>
            <strong>
              {isAdmin ? "Administration" : "Vendor operations"}
            </strong>
          </div>
          <div className="topbar__actions">
            <NavLink to="/notifications" className="icon-button">
              <Bell size={19} />
            </NavLink>
            <NavLink to="/profile" className="avatar">
              {user?.name?.[0] || "S"}
            </NavLink>
          </div>
        </header>
        <section className="content">
          <Outlet />
        </section>
      </main>

      {toast && (
        <div className="toast">
          <Bell size={18} />
          <div>
            <strong>{toast.title}</strong>
            <span>{toast.body}</span>
          </div>
        </div>
      )}
    </div>
  );
}
