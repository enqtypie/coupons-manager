"use client";

import { CalendarDays, Bell } from "lucide-react";
import type { CouponRecord, NotifItem } from "@/app/lib/types";
import MiniCalendar from "./MiniCalendar";

interface NotifCardProps {
  title: string;
  items: NotifItem[];
  variant: "blue" | "amber";
  eventsByDate?: Map<string, string[]>;
  onItemClick?: (coupon: CouponRecord) => void;
}

const COLORS = {
  blue: { label: "#185FA5", dot: "#378ADD" },
  amber: { label: "#854F0B", dot: "#EF9F27" },
};

export default function NotifCard({ title, items, variant, eventsByDate, onItemClick }: NotifCardProps) {
  const c = COLORS[variant];

  return (
    <div className="notif-card">
      <div className="notif-label" style={{ color: c.label }}>
        {variant === "blue" ? <CalendarDays size={14} /> : <Bell size={14} />}
        {title}
      </div>
      {eventsByDate && <MiniCalendar eventsByDate={eventsByDate} />}
      <div className={`notif-list${eventsByDate ? " notif-list--calendar" : ""}`}>
        {items.map((item, i) => {
          const clickable = Boolean(onItemClick && item.coupon);
          return (
            <div
              key={i}
              className={`notif-item${item.urgent ? " notif-item--urgent" : ""}${
                clickable ? " notif-item--clickable" : ""
              }${i === items.length - 1 ? " notif-item--last" : ""}`}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? () => onItemClick!(item.coupon!) : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onItemClick!(item.coupon!);
                      }
                    }
                  : undefined
              }
            >
              <span className="notif-dot" style={{ background: c.dot }} />
              <span className="notif-text">
                {item.text}
                <span className="notif-sub">{item.sub}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
