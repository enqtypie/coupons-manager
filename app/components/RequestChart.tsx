"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { rowToRecord } from "@/app/lib/types";
import type { CouponRecord } from "@/app/lib/types";

function getLast10Days(): string[] {
  const days: string[] = [];
  for (let i = 9; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function formatLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function RequestChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCoupons() {
      const { data, error } = await supabase.from("coupons").select("*");
      if (error) {
        console.error("Failed to load chart data:", error.message);
      } else {
        setCoupons(data.map(rowToRecord));
      }
      setLoading(false);
    }
    loadCoupons();
  }, []);

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

      const days = getLast10Days();
      const activations = days.map(
        (day) => coupons.filter((c) => c.startDate === day).length
      );
      const requests = days.map(
        (day) => coupons.filter((c) => c.date === day).length
      );
      const labels = days.map(formatLabel);

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
            tooltip: { mode: "index", intersect: false },
          },
          scales: {
            x: {
              grid: { color: "rgba(0,0,0,0.04)" },
              ticks: { font: { size: 11 }, color: "#888" },
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
  }, [loading, coupons]);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <p className="chart-title">Total requests by day</p>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: "#378ADD" }} />
            Activations
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: "#E24B4A" }} />
            Requests
          </span>
        </div>
      </div>
      <p className="chart-sub">Last 10 days — coupon team activity</p>
      <div className="chart-wrap">
        {loading ? (
          <p>Loading chart...</p>
        ) : (
          <canvas
            ref={canvasRef}
            aria-label="Line chart showing activations and inquiries over the last 10 days."
            role="img"
          />
        )}
      </div>
    </div>
  );
}