"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import AuthGuard from "@/app/components/AuthGuard";
import CouponsTable from "@/app/components/CouponsTable";
import ViewCouponModal from "@/app/components/ViewCouponModal";
import CreateCouponModal from "@/app/components/CreateCouponModal";
import EditCouponModal from "@/app/components/EditCouponModal";
import type { CouponRecord } from "@/app/lib/types";
import "./coupons-tracker.css";

type FilterOption = "All" | "Active" | "Inactive" | "Alphabetical" | "Start Date" | "End Date";

const PAGE_SIZE = 50;

function CouponsTrackerContent() {
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewCoupon, setViewCoupon] = useState<CouponRecord | null>(null);
  const [editCoupon, setEditCoupon] = useState<CouponRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterOption, setFilterOption] = useState<FilterOption>("All");
  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);

  const latestRequestId = useRef(0);

  // Debounce search input so every keystroke doesn't hit the backend.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Jump back to page 1 whenever the search/filter changes the result set.
  const queryKey = `${debouncedSearch}|${filterOption}`;
  const [prevQueryKey, setPrevQueryKey] = useState(queryKey);
  if (queryKey !== prevQueryKey) {
    setPrevQueryKey(queryKey);
    setPage(1);
  }

  useEffect(() => {
    const requestId = ++latestRequestId.current;

    async function loadCoupons() {
      setLoading(true);

      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("filter", filterOption);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));

      const res = await fetch(`/api/coupons?${params.toString()}`, { cache: "no-store" });

      if (requestId !== latestRequestId.current) return; // a newer request has since started

      if (!res.ok) {
        console.error("Failed to load coupons:", res.statusText);
      } else {
        const data = await res.json();
        setCoupons(data.coupons as CouponRecord[]);
        setTotalCount(data.total ?? 0);
      }
      setLoading(false);
    }

    loadCoupons();
  }, [page, debouncedSearch, filterOption, reloadToken]);

  async function handleCreate(form: Omit<CouponRecord, "id">) {
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      console.error("Failed to create coupon:", res.statusText);
      return;
    }
    if (page === 1) setReloadToken((t) => t + 1);
    else setPage(1);
  }

  async function handleSaveEdit(updated: CouponRecord) {
    const res = await fetch(`/api/coupons/${updated.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (!res.ok) {
      console.error("Failed to update coupon:", res.statusText);
      return;
    }
    setReloadToken((t) => t + 1);
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="tracker-header">
          <h1 className="tracker-title">Coupons Tracker</h1>
          <button className="btn-primary" type="button" onClick={() => setIsCreateOpen(true)}>
            Create new
          </button>
        </div>

        <div className="toolbar">
          <div className="search-wrap">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search by promo title, code, sender, agent, date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value as FilterOption)}
          >
            <option value="All">All Coupons</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Alphabetical">Alphabetical (A–Z)</option>
            <option value="Start Date">Start Date</option>
            <option value="End Date">End Date</option>
          </select>
        </div>

        {loading && coupons.length === 0 ? (
          <p>Loading coupons...</p>
        ) : (
          <>
            <CouponsTable
              couponsrecords={coupons}
              onView={(coupon) => setViewCoupon(coupon)}
              onEdit={(coupon) => setEditCoupon(coupon)}
            />
            <div className="pagination">
              <p className="pagination-info">
                {totalCount === 0
                  ? "No coupons found"
                  : `Showing ${rangeStart}–${rangeEnd} of ${totalCount}`}
              </p>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span className="pagination-page">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <ViewCouponModal coupon={viewCoupon} onClose={() => setViewCoupon(null)} />
      <CreateCouponModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />
      <EditCouponModal
        coupon={editCoupon}
        onClose={() => setEditCoupon(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}

export default function CouponsTrackerPage() {
  return (
    <AuthGuard>
      <CouponsTrackerContent />
    </AuthGuard>
  );
}
