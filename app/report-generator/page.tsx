"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import AuthGuard from "@/app/components/AuthGuard";
import "../coupons-tracker/coupons-tracker.css";
import "../settings/settings.css";
import "./report-generator.css";

type DateField = "request" | "activation";

type Filters = {
  dateField: DateField;
  from: string;
  to: string;
  locationsInput: string;
};

function buildExportParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  params.set("dateField", filters.dateField);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const locations = filters.locationsInput
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (locations.length) params.set("locations", locations.join(","));
  return params;
}

function ReportGeneratorContent() {
  const [dateField, setDateField] = useState<DateField>("request");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [locationsInput, setLocationsInput] = useState("");

  const [debounced, setDebounced] = useState<Filters>({ dateField, from, to, locationsInput });
  const [count, setCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [error, setError] = useState("");

  const rangeInvalid = Boolean(from && to && from > to);

  // Debounce filter changes so every keystroke doesn't hit the backend.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced({ dateField, from, to, locationsInput });
    }, 300);
    return () => clearTimeout(timer);
  }, [dateField, from, to, locationsInput]);

  useEffect(() => {
    if (debounced.from && debounced.to && debounced.from > debounced.to) {
      return;
    }

    let cancelled = false;

    async function loadCount() {
      setCountLoading(true);
      const params = buildExportParams(debounced);
      params.set("format", "count");
      const res = await fetch(`/api/coupons/export?${params.toString()}`, { cache: "no-store" });
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        setCount(data.total ?? 0);
      }
      setCountLoading(false);
    }

    loadCount();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  function handleExport() {
    if (rangeInvalid) {
      setError("The start date must be before the end date.");
      return;
    }
    setError("");
    const params = buildExportParams({ dateField, from, to, locationsInput });
    window.location.href = `/api/coupons/export?${params.toString()}`;
  }

  function handleReset() {
    setDateField("request");
    setFrom("");
    setTo("");
    setLocationsInput("");
    setError("");
  }

  const hasFilters = Boolean(from || to || locationsInput.trim());

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="tracker-header">
          <h1 className="tracker-title">Report Generator</h1>
        </div>

        <section className="settings-section">
          <h2 className="settings-section-title">Date range</h2>
          <p className="settings-section-sub">
            Leave both dates blank to include coupons from every date.
          </p>

          <div className="report-field-row">
            <label className="name-edit-label">
              Filter by
              <select
                className="filter-select"
                value={dateField}
                onChange={(e) => setDateField(e.target.value as DateField)}
              >
                <option value="request">Request date</option>
                <option value="activation">Activation window (start / end date)</option>
              </select>
            </label>
            <label className="name-edit-label">
              From
              <input
                type="date"
                className="name-edit-input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="name-edit-label">
              Through
              <input
                type="date"
                className="name-edit-input"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>
          {rangeInvalid && <p className="report-error">The start date must be before the end date.</p>}
        </section>

        <section className="settings-section">
          <h2 className="settings-section-title">Locations</h2>
          <p className="settings-section-sub">
            Matches against the &quot;Participating Stores&quot; field. Separate multiple locations with
            commas (e.g. &quot;Store #123, Store #456&quot;) &mdash; a coupon is included if it matches any of
            them. Leave blank to include all locations.
          </p>
          <label className="name-edit-label">
            Locations
            <input
              type="text"
              className="name-edit-input"
              placeholder="e.g. Store #123, All Stores"
              value={locationsInput}
              onChange={(e) => setLocationsInput(e.target.value)}
            />
          </label>
        </section>

        <section className="settings-section">
          <div className="report-summary-row">
            <p className="report-summary">
              {rangeInvalid
                ? "—"
                : countLoading
                ? "Counting matching coupons..."
                : count === null
                ? "—"
                : hasFilters
                ? `${count} coupon${count === 1 ? "" : "s"} match these filters.`
                : `${count} coupon${count === 1 ? "" : "s"} in total.`}
            </p>
            <div className="report-actions">
              <button type="button" className="row-action" onClick={handleReset}>
                Reset filters
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleExport}
                disabled={rangeInvalid || count === 0}
              >
                Export CSV
              </button>
            </div>
          </div>
          {error && <p className="report-error">{error}</p>}
        </section>
      </main>
    </div>
  );
}

export default function ReportGeneratorPage() {
  return (
    <AuthGuard>
      <ReportGeneratorContent />
    </AuthGuard>
  );
}
