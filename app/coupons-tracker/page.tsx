"use client";

import { useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import CouponsTable from "@/app/components/CouponsTable";
import ViewCouponModal from "@/app/components/ViewCouponModal";
import CreateCouponModal from "@/app/components/CreateCouponModal";
import EditCouponModal from "@/app/components/EditCouponModal";
import { SAMPLE_COUPONS } from "@/app/lib/data";
import type { CouponRecord } from "@/app/lib/types";
import "./coupons-tracker.css";

export default function CouponsTrackerPage() {
  const [coupons, setCoupons] = useState<CouponRecord[]>(SAMPLE_COUPONS);
  const [viewCoupon, setViewCoupon] = useState<CouponRecord | null>(null);
  const [editCoupon, setEditCoupon] = useState<CouponRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  function handleSaveEdit(updated: CouponRecord) {
    setCoupons((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  }

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

        <CouponsTable
          couponsrecords={coupons}
          onView={(coupon) => setViewCoupon(coupon)}
          onEdit={(coupon) => setEditCoupon(coupon)}
        />
      </main>

      <ViewCouponModal coupon={viewCoupon} onClose={() => setViewCoupon(null)} />
      <CreateCouponModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={(coupon) => setCoupons((prev) => [coupon, ...prev])}
      />
      <EditCouponModal
        coupon={editCoupon}
        onClose={() => setEditCoupon(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}