import { useEffect, useMemo, useState } from "react";
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
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
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
  const [searchOpenPath, setSearchOpenPath] = useState(null);
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = user?.role === "ADMIN";
  const searchOpen = searchOpenPath === location.pathname;
  const searchTerm = searchParams.get("q") || "";
  const vendorVehicles = useQuery({
    queryKey: ["vendor-vehicles"],
    queryFn: () => api.get("/vehicles/vendor/me"),
    enabled: user?.role === "VENDOR",
  });
  const vendorBookings = useQuery({
    queryKey: ["vendor-bookings"],
    queryFn: () => api.get("/bookings/vendor/me"),
    enabled: user?.role === "VENDOR",
  });
  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    const vehicles = (vendorVehicles.data || [])
      .filter(vehicle => [
        vehicle.displayName, vehicle.brand, vehicle.model, vehicle.year,
        vehicle.registrationNumber, vehicle.city,
      ].filter(Boolean).join(" ").toLowerCase().includes(term))
      .slice(0, 4)
      .map(vehicle => ({
        key: vehicle._id || vehicle.id,
        label: vehicle.displayName || `${vehicle.brand} ${vehicle.model}`,
        detail: `${vehicle.registrationNumber || "Vehicle"} · ${vehicle.city || "Fleet"}`,
        to: "/vehicles",
      }));
    const bookings = (vendorBookings.data || [])
      .filter(booking => [
        booking.bookingCode, booking.customer?.name,
        booking.vehicle?.brand, booking.vehicle?.model,
        booking.status,
      ].filter(Boolean).join(" ").toLowerCase().includes(term))
      .slice(0, 4)
      .map(booking => ({
        key: booking._id || booking.id,
        label: booking.bookingCode || "Booking",
        detail: `${booking.customer?.name || "Customer"} · ${booking.status?.replaceAll("_", " ") || "Booking"}`,
        to: "/bookings",
      }));
    const vendorPages = [
      ["/", "Dashboard", "Vendor overview"],
      ["/vehicles", "My Fleet", "Vehicles and availability"],
      ["/bookings", "Bookings", "Customer reservations"],
      ["/earnings", "Earnings", "Revenue and statements"],
      ["/documents", "Documents", "Business and vehicle compliance"],
      ["/settings", "Settings", "Business and account preferences"],
      ["/notifications", "Notifications", "Workspace alerts"],
    ];
    const adminPages = [
      ["/", "Overview", "Platform dashboard"],
      ["/admin/users", "Users", "Manage platform accounts"],
      ["/admin/vendors", "Vendors", "Manage vendor accounts"],
      ["/admin/drivers", "Drivers", "Manage drivers"],
      ["/admin/bookings", "Assignments", "Manage bookings"],
      ["/admin/vehicles", "Vehicles", "Manage vehicle inventory"],
      ["/reports", "Reports", "Platform reports"],
      ["/analytics", "Analytics", "Platform analytics"],
    ];
    const pages = (isAdmin ? adminPages : vendorPages)
      .filter(([, label, detail]) => `${label} ${detail}`.toLowerCase().includes(term))
      .map(([to, label, detail]) => ({ key: to, label: `Go to ${label}`, detail, to, type: "page" }));
    return [...vehicles, ...bookings, ...pages].slice(0, 7);
  }, [isAdmin, searchTerm, vendorBookings.data, vendorVehicles.data]);

  const updateSearch = value => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set("q", value);
    else nextParams.delete("q");
    setSearchParams(nextParams, { replace: true });
  };

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
          <div className="topbar-search-wrap">
            <label
              className="topbar-search"
              onBlur={event => {
                if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) {
                  setSearchOpenPath(null);
                }
              }}
            >
              <Search size={17} aria-hidden="true" />
              <input
                aria-label="Search vehicles and bookings"
                type="search"
                placeholder={isAdmin ? "Search this workspace..." : "Search vehicles, bookings, pages..."}
                value={searchTerm}
                onFocus={() => setSearchOpenPath(location.pathname)}
                onChange={event => {
                  updateSearch(event.target.value);
                  setSearchOpenPath(location.pathname);
                }}
                onKeyDown={event => {
                  if (event.key === "Escape") setSearchOpenPath(null);
                  if (event.key === "Enter" && searchTerm.trim()) {
                    navigate(searchResults[0]?.to || (isAdmin ? "/admin/bookings" : "/vehicles"));
                    setSearchOpenPath(null);
                  }
                }}
              />
              {searchTerm && (
                <button type="button" aria-label="Clear search" onClick={() => updateSearch("")}>
                  <X size={15} />
                </button>
              )}
            </label>
            {searchOpen && searchTerm.trim() && (
              <div className="topbar-search-results">
                {searchResults.length ? searchResults.map(result => (
                  <button
                    type="button"
                    key={`${result.to}-${result.key}`}
                    onClick={() => {
                      const query = searchParams.toString();
                      navigate(`${result.to}${query ? `?${query}` : ""}`);
                      setSearchOpenPath(null);
                    }}
                  >
                    {result.type === "page"
                      ? <Search size={16} />
                      : result.to === "/vehicles" ? <CarFront size={16} /> : <ClipboardList size={16} />}
                    <span><strong>{result.label}</strong><small>{result.detail}</small></span>
                  </button>
                )) : (
                  <p>
                    {vendorVehicles.isLoading || vendorBookings.isLoading
                      ? "Searching your workspace…"
                      : "No matching results"}
                  </p>
                )}
              </div>
            )}
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
