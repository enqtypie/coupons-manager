"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import CouponsTable from "@/app/components/CouponsTable";
import ViewCouponModal from "@/app/components/ViewCouponModal";
import CreateCouponModal from "@/app/components/CreateCouponModal";
import EditCouponModal from "@/app/components/EditCouponModal";
import { supabase } from "@/app/lib/supabase";
import { rowToRecord } from "@/app/lib/types";
import type { CouponRecord } from "@/app/lib/types";
import "./coupons-tracker.css";

type FilterOption = "All" | "Active" | "Inactive" | "Alphabetical" | "Start Date" | "End Date";

export default function CouponsTrackerPage() {
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewCoupon, setViewCoupon] = useState<CouponRecord | null>(null);
  const [editCoupon, setEditCoupon] = useState<CouponRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterOption, setFilterOption] = useState<FilterOption>("All");

  async function loadCoupons() {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load coupons:", error.message);
    } else {
      setCoupons(data.map(rowToRecord));
    }
    setLoading(false);
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  async function handleCreate(form: Omit<CouponRecord, "id">) {
    const { error } = await supabase.from("coupons").insert({
      date: form.date,
      status: form.status,
      source: form.source,
      source_ref: form.sourceRef || null,
      sender: form.sender,
      type: form.type,
      promo_title: form.promoTitle,
      code: form.code,
      promo_link: form.promoLink || null,
      redemption_type: form.redemptionType,
      start_date: form.startDate || null,
      end_date: form.endDate || null,
      participating_stores: form.participatingStores || null,
      agent_handling: form.agentHandling,
      agent_sign_off: form.agentSignOff || null,
      start_of_day_check: form.startOfDayCheck || null,
      calendar_invite_created: form.calendarInviteCreated,
    });
    if (error) {
      console.error("Failed to create coupon:", error.message);
      return;
    }
    await loadCoupons();
  }

  async function handleSaveEdit(updated: CouponRecord) {
    const { error } = await supabase
      .from("coupons")
      .update({
        date: updated.date,
        status: updated.status,
        source: updated.source,
        source_ref: updated.sourceRef || null,
        sender: updated.sender,
        type: updated.type,
        promo_title: updated.promoTitle,
        code: updated.code,
        promo_link: updated.promoLink || null,
        redemption_type: updated.redemptionType,
        start_date: updated.startDate || null,
        end_date: updated.endDate || null,
        participating_stores: updated.participatingStores || null,
        agent_handling: updated.agentHandling,
        agent_sign_off: updated.agentSignOff || null,
        start_of_day_check: updated.startOfDayCheck || null,
        calendar_invite_created: updated.calendarInviteCreated,
      })
      .eq("id", updated.id);

    if (error) {
      console.error("Failed to update coupon:", error.message);
      return;
    }
    await loadCoupons();
  }

  const visibleCoupons = useMemo(() => {
    let result = coupons.filter((c) => {
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const haystack = [
          c.promoTitle,
          c.code,
          c.sender,
          c.source,
          c.sourceRef ?? "",
          c.type,
          c.agentHandling,
          c.agentSignOff,
          c.participatingStores,
          c.date,
          c.startDate,
          c.endDate,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    switch (filterOption) {
      case "All":
        break;
      case "Active":
        result = result.filter((c) => c.status === "Active");
        break;
      case "Inactive":
        result = result.filter((c) => c.status === "Inactive");
        break;
      case "Alphabetical":
        result = [...result].sort((a, b) => a.promoTitle.localeCompare(b.promoTitle));
        break;
      case "Start Date":
        result = [...result].sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
        break;
      case "End Date":
        result = [...result].sort((a, b) => (a.endDate || "").localeCompare(b.endDate || ""));
        break;
    }

    return result;
  }, [coupons, searchTerm, filterOption]);

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

        {loading ? (
          <p>Loading coupons...</p>
        ) : (
          <CouponsTable
            couponsrecords={visibleCoupons}
            onView={(coupon) => setViewCoupon(coupon)}
            onEdit={(coupon) => setEditCoupon(coupon)}
          />
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