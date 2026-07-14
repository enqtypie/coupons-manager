"use client";

import { useEffect, useRef } from "react";
import { CHART_LABELS, ACTIVATIONS, INQUIRIES } from "@/app/lib/data";

export default function RequestChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let chartInstance: import("chart.js").Chart | null = null;

    async function initChart() {
      const { Chart, registerables } = await import("chart.js");
      Chart.register(...registerables);
      if (!canvasRef.current || cancelled) return;

      // Safety net: destroy any chart already attached to this canvas
      const existing = Chart.getChart(canvasRef.current);
      existing?.destroy();

      chartInstance = new Chart(canvasRef.current, {
        type: "line",
        data: {
          labels: CHART_LABELS,
          datasets: [
            {
              label: "Activations",
              data: ACTIVATIONS,
              borderColor: "#378ADD",
              backgroundColor: "rgba(55,138,221,0.10)",
              tension: 0.4,
              fill: true,
              pointRadius: 3,
              pointBackgroundColor: "#378ADD",
              borderWidth: 2,
            },
            {
              label: "Inquiries",
              data: INQUIRIES,
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
              ticks: { font: { size: 11 }, color: "#888", stepSize: 20 },
              min: 0,
              max: 120,
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
  }, []);

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
            Inquiries
          </span>
        </div>
      </div>
      <p className="chart-sub">Last 10 days — coupon team activity</p>
      <div className="chart-wrap">
        <canvas
          ref={canvasRef}
          aria-label="Line chart showing activations and inquiries over the last 10 days."
          role="img"
        />
      </div>
    </div>
  );
}