"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { NAV } from "@/app/lib/data";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Coupons Manager</h1>
        <p className="sidebar-subtitle">Jet's Pizza — US Operations</p>
        <div className="avatar-row">
          <div className="avatar">MJ</div>
          <div>
            <p className="avatar-name">Mark J.</p>
            <p className="avatar-role">Coupons Team</p>
          </div>
        </div>
      </div>

      <nav className="nav">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="nav-section">{group.section}</p>
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`nav-item${isActive ? " nav-item--active" : ""}`}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}