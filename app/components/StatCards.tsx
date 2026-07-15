"use client";

import { STATS } from "@/app/lib/data";

export default function StatCards({
  counts,
}: {
  counts: Record<string, { value: number; sub: string }>;
}) {
  return (
    <div className="stats-row">
      {STATS.map((s) => {
        const computed = counts[s.key];
        return (
          <div key={s.label} className="stat-card">
            <div className="stat-accent" style={{ background: s.accent }} />
            <div
              className="stat-icon"
              style={{ background: s.iconBg, color: s.iconColor }}
            >
              {s.icon}
            </div>
            <p className="stat-label">{s.label}</p>
            <p className="stat-value">{computed ? computed.value : "—"}</p>
            <p className="stat-sub">{computed ? computed.sub : "Loading..."}</p>
          </div>
        );
      })}
    </div>
  );
}