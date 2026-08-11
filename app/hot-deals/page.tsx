"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import AuthGuard from "@/app/components/AuthGuard";
import ImportHotDealsModal from "./ImportHotDealsModal";
import type { HotDealsBatchDetail, HotDealsBatchSummary } from "@/app/lib/hot-deals-types";
import { formatDate } from "@/app/lib/date";
import "../coupons-tracker/coupons-tracker.css";
import "./hot-deals.css";

function formatMoney(value: number | null): string {
  return value === null ? "—" : `$${value.toFixed(2)}`;
}

function HotDealsContent() {
  const [batches, setBatches] = useState<HotDealsBatchSummary[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [detail, setDetail] = useState<HotDealsBatchDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [isImportOpen, setIsImportOpen] = useState(false);

  const [sortKey, setSortKey] = useState<"store" | number>("store");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");

  function selectBatch(id: number | null) {
    setSelectedId(id);
    setSortKey("store");
    setSortDir("asc");
    setSearchTerm("");
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingBatches(true);
      const res = await fetch("/api/hot-deals", { cache: "no-store" });
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        const loaded = data.batches as HotDealsBatchSummary[];
        setBatches(loaded);
        setSelectedId((current) => current ?? loaded[0]?.id ?? null);
      }
      setLoadingBatches(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedId === null) {
      return;
    }
    let cancelled = false;
    async function load() {
      setLoadingDetail(true);
      const res = await fetch(`/api/hot-deals/${selectedId}`, { cache: "no-store" });
      if (cancelled) return;
      if (res.ok) {
        setDetail((await res.json()) as HotDealsBatchDetail);
      }
      setLoadingDetail(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  function handleImported(batch: HotDealsBatchSummary) {
    setBatches((prev) => [batch, ...prev]);
    selectBatch(batch.id);
  }

  async function handleDelete() {
    if (selectedId === null) return;
    const batch = batches.find((b) => b.id === selectedId);
    if (!confirm(`Delete "${batch?.name ?? "this batch"}"? This can't be undone.`)) return;

    await fetch(`/api/hot-deals/${selectedId}`, { method: "DELETE" });
    const remaining = batches.filter((b) => b.id !== selectedId);
    setBatches(remaining);
    selectBatch(remaining[0]?.id ?? null);
  }

  const visibleRows = detail
    ? detail.storeRows.filter((row) =>
        row.storeId.toLowerCase().includes(searchTerm.trim().toLowerCase())
      )
    : [];

  const sortedRows = detail
    ? [...visibleRows].sort((a, b) => {
        if (sortKey === "store") {
          return sortDir === "asc"
            ? a.storeId.localeCompare(b.storeId)
            : b.storeId.localeCompare(a.storeId);
        }
        const av = a.bandValues[String(sortKey)]?.tier ?? null;
        const bv = b.bandValues[String(sortKey)]?.tier ?? null;
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return sortDir === "asc" ? av - bv : bv - av;
      })
    : [];

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="tracker-header">
          <h1 className="tracker-title">Quarterly Hot Deals</h1>
          <button className="btn-primary" type="button" onClick={() => setIsImportOpen(true)}>
            Add Quarterly Hot Deals
          </button>
        </div>

        {loadingBatches ? (
          <p>Loading...</p>
        ) : batches.length === 0 ? (
          <p className="hotdeals-empty">No hot deals imported yet. Add one to get started.</p>
        ) : (
          <div className="hotdeals-content">
            <div className="hotdeals-tabs">
              {batches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`hotdeals-tab${b.id === selectedId ? " hotdeals-tab--active" : ""}`}
                  onClick={() => selectBatch(b.id)}
                >
                  {b.name}
                </button>
              ))}
            </div>

            {loadingDetail || !detail ? (
              <p>Loading batch...</p>
            ) : (
              <div className="hotdeals-panel">
                <div className="search-wrap hotdeals-search">
                  <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by store ID / location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {searchTerm.trim() && (
                  <p className="hotdeals-search-count">
                    {visibleRows.length} of {detail.storeRows.length} stores match &quot;{searchTerm}&quot;
                  </p>
                )}

                <div className="hotdeals-toolbar">
                  {detail.flatDeals.length > 0 && (
                    <div className="hotdeals-flat-deals">
                      <span className="hotdeals-flat-label">Storewide:</span>
                      {detail.flatDeals.map((d) => (
                        <span className="hotdeals-flat-pill" key={d.id}>
                          {d.name} ({d.code})
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="hotdeals-sort">
                    <label className="hotdeals-sort-label">
                      Sort by
                      <select
                        value={sortKey}
                        onChange={(e) =>
                          setSortKey(e.target.value === "store" ? "store" : Number(e.target.value))
                        }
                      >
                        <option value="store">Store ID</option>
                        {detail.bandDeals.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.code}) — Tier
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="row-action"
                      onClick={() => setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))}
                    >
                      {sortDir === "asc" ? "Ascending ↑" : "Descending ↓"}
                    </button>
                  </div>
                  <button type="button" className="row-action row-action--danger" onClick={handleDelete}>
                    Delete this batch
                  </button>
                </div>

                <div className="table-card">
                  <div className="table-card-scroll">
                    <table className="coupons-table hotdeals-table">
                      <thead>
                        <tr>
                          <th>Store ID</th>
                          {detail.bandDeals.map((d) => (
                            <th key={d.id}>
                              {d.name} ({d.code})
                              <span className="hotdeals-th-sub">Tier · Price</span>
                            </th>
                          ))}
                          <th>Expiration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRows.map((row) => (
                          <tr key={row.id}>
                            <td>{row.storeId}</td>
                            {detail.bandDeals.map((d) => {
                              const value = row.bandValues[String(d.id)];
                              return (
                                <td key={d.id}>
                                  {value ? `${value.tier ?? "—"} · ${formatMoney(value.price)}` : "—"}
                                </td>
                              );
                            })}
                            <td>{formatDate(row.expirationDate) || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <ImportHotDealsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={handleImported}
      />
    </div>
  );
}

export default function HotDealsPage() {
  return (
    <AuthGuard>
      <HotDealsContent />
    </AuthGuard>
  );
}
