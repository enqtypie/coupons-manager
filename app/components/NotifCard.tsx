"use client";

import { CalendarDays, Bell } from "lucide-react";
import type { NotifItem } from "@/app/lib/types";

interface NotifCardProps {
  title: string;
  items: NotifItem[];
  variant: "blue" | "amber";
}

const COLORS = {
  blue: { label: "#185FA5", dot: "#378ADD" },
  amber: { label: "#854F0B", dot: "#EF9F27" },
};

export default function NotifCard({ title, items, variant }: NotifCardProps) {
  const c = COLORS[variant];

  return (
    <div className="notif-card">
      <div className="notif-label" style={{ color: c.label }}>
        {variant === "blue" ? <CalendarDays size={14} /> : <Bell size={14} />}
        {title}
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          className={`notif-item${i === items.length - 1 ? " notif-item--last" : ""}`}
        >
          <span className="notif-dot" style={{ background: c.dot }} />
          <span className="notif-text">
            {item.text}
            <span className="notif-sub">{item.sub}</span>
          </span>
        </div>
      ))}
    </div>
  );
}