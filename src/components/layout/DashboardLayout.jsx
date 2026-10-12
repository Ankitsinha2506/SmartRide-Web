import { useEffect, useState } from "react";
import {
  Bell,
  CarFront,
  ChartNoAxesCombined,
  ClipboardList,
  IdCard,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
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
      ["/profile", "Profile", UserCircle],
      ["/settings", "Settings", Settings],
    ],
  },
];

const adminLinks = [
  ["/admin/dashboard", "Overview", LayoutDashboard],
  ["/admin/users", "Users", Users],
  ["/admin/vendors", "Vendors", ShieldCheck],
  ["/admin/drivers", "Drivers", IdCard],
  ["/admin/bookings", "Bookings", ClipboardList],
  ["/admin/vehicles", "Vehicles", CarFront],
  ["/admin/reviews", "Reviews", ClipboardList],
  ["/reports?tab=payments", "Payments", ClipboardList],
  ["/analytics", "Analytics", ChartNoAxesCombined],
];

export function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";
  const searchResults = adminLinks.filter(([, label]) =>
    label.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  );

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
      <aside className={`sidebar ${open ? "sidebar--open" : ""} ${isAdmin ? "sidebar--admin" : ""}`}>
        <div className="brand">
          <span className={isAdmin ? "brand__mark--admin" : ""}>
            <CarFront />
          </span>
          <div>
            SmartRide<small>Move smarter</small>
          </div>
          <button className="mobile-close" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>

        <nav>
          {isAdmin ? (
            adminLinks.map(([to, label, Icon]) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => setOpen(false)}
                className={isAdmin ? "admin-nav-link" : undefined}
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

        <div className="sidebar-footer">
          <div className={`sidebar-footer__avatar ${isAdmin ? "sidebar-footer__avatar--admin" : ""}`}>
            {user?.name?.[0]?.toUpperCase() || "S"}
          </div>
          <div>
            <div className="sidebar-footer__name">{user?.name || "Vendor"}</div>
            <div className="sidebar-footer__role">{user?.role}</div>
          </div>
        </div>

        <button
          className={`logout ${isAdmin ? "logout--admin" : ""}`}
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <LogOut size={18} /> Sign out
        </button>
      </aside>

      {open && <button className="backdrop" onClick={() => setOpen(false)} />}

      <main className={`main ${isAdmin ? "admin-main" : ""}`}>
        <header className={`topbar ${isAdmin ? "!border-[#e5e9e4] !bg-white/95" : ""}`}>
          <button className="menu-button" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          {!isAdmin && (
            <div>
              <small>Workspace</small>
              <strong>Vendor operations</strong>
            </div>
          )}
          {isAdmin && (
            <div className="admin-global-search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search admin pages..."
                aria-label="Search admin pages"
                aria-expanded={searchOpen && Boolean(searchTerm.trim())}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setSearchTerm("");
                    setSearchOpen(false);
                  }
                  if (event.key === "Enter" && searchResults[0]) {
                    navigate(searchResults[0][0]);
                    setSearchTerm("");
                    setSearchOpen(false);
                  }
                }}
                value={searchTerm}
              />
              {searchOpen && searchTerm.trim() && (
                <div className="admin-global-search__results">
                  {searchResults.length ? searchResults.map(([to, label, Icon]) => (
                    <NavLink key={to} to={to} onClick={() => setSearchTerm("")}>
                      <Icon size={16} />{label}
                    </NavLink>
                  )) : <span>No matching admin pages</span>}
                </div>
              )}
            </div>
          )}
          <div className="topbar__actions">
            <NavLink to="/notifications" className="icon-button">
              <Bell size={19} />
            </NavLink>
            <NavLink to="/profile" className={`avatar ${isAdmin ? "avatar--admin" : ""}`}>
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
