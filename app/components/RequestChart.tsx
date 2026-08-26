"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CouponRecord } from "@/app/lib/types";

const YEARS_SHOWN = 5;
const MAX_TOOLTIP_CODES = 8;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function getLast10Days(): string[] {
  const days: string[] = [];
  for (let i = 9; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Resolves which calendar month "Whole Month" should show, offset from the
// current month (0 = this month, -1 = last month, ...).
function getTargetMonth(offset: number): { year: number; month: number } {
  const now = new Date();
  let month = now.getMonth() + offset;
  let year = now.getFullYear();
  while (month < 0) {
    month += 12;
    year -= 1;
  }
  while (month > 11) {
    month -= 12;
    year += 1;
  }
  return { year, month };
}

function getDaysInTargetMonth(year: number, month: number): string[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: string[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(`${year}-${pad(month + 1)}-${pad(day)}`);
  }
  return days;
}

function getLast12Months(): { key: string; label: string }[] {
  const now = new Date();
  const result: { key: string; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    let month = now.getMonth() - i;
    let year = now.getFullYear();
    while (month < 0) {
      month += 12;
      year -= 1;
    }
    result.push({
      key: `${year}-${pad(month + 1)}`,
      label: new Date(year, month, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    });
  }
  return result;
}

function getLastNYears(n: number): { key: string; label: string }[] {
  const nowYear = new Date().getFullYear();
  const result: { key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const year = nowYear - i;
    result.push({ key: String(year), label: String(year) });
  }
  return result;
}

function formatCodesForTooltip(codes: string[]): string {
  if (codes.length === 0) return "none";
  if (codes.length <= MAX_TOOLTIP_CODES) return codes.join(", ");
  return `${codes.slice(0, MAX_TOOLTIP_CODES).join(", ")}, +${codes.length - MAX_TOOLTIP_CODES} more`;
}

type StatusFilter = "all" | "active" | "expired";
type ViewMode = "last10" | "wholeMonth" | "byMonth" | "year";

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  last10: "Last 10 Days",
  wholeMonth: "Whole Month",
  byMonth: "By Month",
  year: "Year",
};

export default function RequestChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("last10");
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    async function loadCoupons() {
      const res = await fetch("/api/coupons", { cache: "no-store" });
      if (!res.ok) {
        console.error("Failed to load chart data:", res.statusText);
      } else {
        const data = await res.json();
        setCoupons(data.coupons as CouponRecord[]);
      }
      setLoading(false);
    }
    loadCoupons();
  }, []);

  const target = getTargetMonth(monthOffset);
  const targetMonthLabel = new Date(target.year, target.month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    if (loading) return;

    let cancelled = false;
    let chartInstance: import("chart.js").Chart | null = null;

    async function initChart() {
      const { Chart, registerables } = await import("chart.js");
      Chart.register(...registerables);
      if (!canvasRef.current || cancelled) return;

      const existing = Chart.getChart(canvasRef.current);
      existing?.destroy();

      const filteredCoupons =
        statusFilter === "all"
          ? coupons
          : coupons.filter((c) =>
              statusFilter === "active" ? c.status === "Active" : c.status === "Inactive"
            );

      let labels: string[];
      let activationCodes: string[][];
      let requestCodes: string[][];

      if (viewMode === "last10") {
        const days = getLast10Days();
        labels = days.map(formatDayLabel);
        activationCodes = days.map((day) => filteredCoupons.filter((c) => c.startDate === day).map((c) => c.code));
        requestCodes = days.map((day) => filteredCoupons.filter((c) => c.date === day).map((c) => c.code));
      } else if (viewMode === "wholeMonth") {
        const days = getDaysInTargetMonth(target.year, target.month);
        labels = days.map((d) => String(Number(d.slice(8, 10))));
        activationCodes = days.map((day) => filteredCoupons.filter((c) => c.startDate === day).map((c) => c.code));
        requestCodes = days.map((day) => filteredCoupons.filter((c) => c.date === day).map((c) => c.code));
      } else if (viewMode === "byMonth") {
        const months = getLast12Months();
        labels = months.map((m) => m.label);
        activationCodes = months.map((m) => filteredCoupons.filter((c) => c.startDate.startsWith(m.key)).map((c) => c.code));
        requestCodes = months.map((m) => filteredCoupons.filter((c) => c.date.startsWith(m.key)).map((c) => c.code));
      } else {
        const years = getLastNYears(YEARS_SHOWN);
        labels = years.map((y) => y.label);
        activationCodes = years.map((y) => filteredCoupons.filter((c) => c.startDate.startsWith(y.key)).map((c) => c.code));
        requestCodes = years.map((y) => filteredCoupons.filter((c) => c.date.startsWith(y.key)).map((c) => c.code));
      }

      const activations = activationCodes.map((codes) => codes.length);
      const requests = requestCodes.map((codes) => codes.length);

      chartInstance = new Chart(canvasRef.current, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Activations",
              data: activations,
              borderColor: "#378ADD",
              backgroundColor: "rgba(55,138,221,0.10)",
              tension: 0.4,
              fill: true,
              pointRadius: 3,
              pointBackgroundColor: "#378ADD",
              borderWidth: 2,
            },
            {
              label: "Requests",
              data: requests,
              borderColor: "#E24B4A",
              backgroundColor: "rgba(226,75,74,0.07)",
              tension: 0.4,
              fill: true,
              pointRadius: 3,
              pointBackgroundColor: "#E24B4A",
              borderWidth: 2,
              borderDash: [4, 3],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: "index",
              intersect: false,
              callbacks: {
                label: (context) => {
                  const codes =
                    context.datasetIndex === 0
                      ? activationCodes[context.dataIndex]
                      : requestCodes[context.dataIndex];
                  const label = context.dataset.label ?? "";
                  return `${label}: ${formatCodesForTooltip(codes ?? [])}`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { color: "rgba(0,0,0,0.04)" },
              ticks: {
                font: { size: 11 },
                color: "#888",
                maxRotation: 0,
                autoSkip: true,
              },
            },
            y: {
              grid: { color: "rgba(0,0,0,0.04)" },
              ticks: { font: { size: 11 }, color: "#888", stepSize: 5 },
              min: 0,
              beginAtZero: true,
            },
          },
        },
      });
    }

    initChart();

    return () => {
      cancelled = true;
      chartInstance?.destroy();
    };
  }, [loading, coupons, statusFilter, viewMode, monthOffset, target.year, target.month]);

  const subtitle =
    viewMode === "last10"
      ? "Last 10 days — coupon team activity"
      : viewMode === "wholeMonth"
      ? `${targetMonthLabel} — coupon team activity`
      : viewMode === "byMonth"
      ? "Last 12 months — coupon team activity"
      : `Last ${YEARS_SHOWN} years — coupon team activity`;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <p className="chart-title">Total requests</p>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: "#378ADD" }} />
            Activations
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: "#E24B4A" }} />
            Requests
          </span>
          <div className="chart-filter">
            {(["all", "active", "expired"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`chart-filter-btn${statusFilter === f ? " chart-filter-btn--active" : ""}`}
                onClick={() => setStatusFilter(f)}
              >
                {f === "all" ? "All" : f === "active" ? "Active" : "Expired"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-controls">
        <div className="chart-filter">
          {(Object.keys(VIEW_MODE_LABELS) as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`chart-filter-btn${viewMode === mode ? " chart-filter-btn--active" : ""}`}
              onClick={() => setViewMode(mode)}
            >
              {VIEW_MODE_LABELS[mode]}
            </button>
          ))}
        </div>
        {viewMode === "wholeMonth" && (
          <div className="chart-month-nav">
            <button type="button" onClick={() => setMonthOffset((o) => o - 1)} aria-label="Previous month">
              <ChevronLeft size={14} />
            </button>
            <span>{targetMonthLabel}</span>
            <button type="button" onClick={() => setMonthOffset((o) => o + 1)} aria-label="Next month">
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <p className="chart-sub">{subtitle}</p>
      <div className="chart-wrap">
        {loading ? (
          <p>Loading chart...</p>
        ) : (
          <canvas
            ref={canvasRef}
            aria-label={`Line chart showing activations and requests — ${subtitle}`}
            role="img"
          />
        )}
      </div>
    </div>
  );
}
