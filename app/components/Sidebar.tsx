"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NAV } from "@/app/lib/data";
import { supabase } from "@/app/lib/supabase";
import { useAuth, getInitials, roleLabel, displayNameOrEmail } from "@/app/lib/auth-context";

const STORAGE_KEY = "sidebarCollapsed";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed, hydrated]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const nameForDisplay = displayNameOrEmail(profile, user?.email);

  return (
    <aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-header-top">
          {!collapsed && <h1 className="sidebar-title">Coupons Manager</h1>}
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
        {!collapsed && <p className="sidebar-subtitle">Jet&apos;s Pizza — US Operations</p>}
        <div className="avatar-row">
          <div className="avatar" title={user?.email ?? undefined}>
            {getInitials(nameForDisplay)}
          </div>
          {!collapsed && (
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
            {!collapsed && <p className="nav-section">{group.section}</p>}
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`nav-item${isActive ? " nav-item--active" : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout} title={collapsed ? "Logout" : undefined}>
          <LogOut size={16} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}