"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { NAV } from "@/app/lib/data";
import { useAuth, getInitials, roleLabel, displayNameOrEmail } from "@/app/lib/auth-context";

const STORAGE_KEY = "sidebarCollapsed";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed, hydrated]);

  // Close the mobile menu whenever the route changes (e.g. after tapping a nav link).
  useEffect(() => {
    async function close() {
      setMobileOpen(false);
    }
    close();
  }, [pathname]);

  // Lock page scroll behind the dropdown while it's open on mobile.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refreshProfile();
    router.push("/login");
  }

  const nameForDisplay = displayNameOrEmail(profile, user?.email);
  // The mobile dropdown always shows full labels, regardless of the desktop
  // collapse preference — collapsing only makes sense for the persistent
  // side rail, not a temporary overlay.
  const showCollapsed = collapsed && !mobileOpen;

  return (
    <>
      <div className="mobile-topbar">
        <div className="mobile-topbar-text">
          <span className="mobile-topbar-title">LOKE Coupons Manager</span>
          <span className="mobile-topbar-welcome">Welcome {nameForDisplay.split(" ")[0]}</span>
        </div>
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <span className={`menu-icon${mobileOpen ? " menu-icon--open" : ""}`}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </span>
        </button>
      </div>
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}
      <aside
        className={`sidebar${showCollapsed ? " sidebar--collapsed" : ""}${mobileOpen ? " sidebar--mobile-open" : ""}`}
      >
      <div className="sidebar-header">
        <div className="sidebar-header-top">
          {!showCollapsed && <h1 className="sidebar-title">Coupons Manager</h1>}
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        {!showCollapsed && <p className="sidebar-subtitle">Jet&apos;s Pizza — US Operations</p>}
        <div className="avatar-row">
          <div className="avatar" title={user?.email ?? undefined}>
            {getInitials(nameForDisplay)}
          </div>
          {!showCollapsed && (
            <div className="avatar-info">
              <p className="avatar-name" title={user?.email ?? undefined}>
                {nameForDisplay}
              </p>
              <p className="avatar-role">{roleLabel(profile?.role ?? null)}</p>
            </div>
          )}
        </div>
      </div>

      <nav className="nav">
        {NAV.map((group) => (
          <div key={group.section}>
            {!showCollapsed && <p className="nav-section">{group.section}</p>}
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`nav-item${isActive ? " nav-item--active" : ""}`}
                  title={showCollapsed ? item.label : undefined}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  {!showCollapsed && item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout} title={showCollapsed ? "Logout" : undefined}>
          <LogOut size={16} />
          {!showCollapsed && "Logout"}
        </button>
      </div>
      </aside>
    </>
  );
}