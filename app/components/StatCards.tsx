"use client";

import { STATS } from "@/app/lib/data";

export default function StatCards() {
  return (
    <div className="stats-row">
      {STATS.map((s) => (
        <div key={s.label} className="stat-card">
          <div className="stat-accent" style={{ background: s.accent }} />
          <div
            className="stat-icon"
            style={{ background: s.iconBg, color: s.iconColor }}
          >
            {s.icon}
          </div>
          <p className="stat-label">{s.label}</p>
          <p className="stat-value">{s.value}</p>
          <p className="stat-sub">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}