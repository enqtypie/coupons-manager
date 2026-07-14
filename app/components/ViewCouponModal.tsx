"use client";

import type { CouponRecord } from "@/app/lib/types";
import Modal from "./Modal";

export default function ViewCouponModal({
  coupon,
  onClose,
}: {
  coupon: CouponRecord | null;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={!!coupon} onClose={onClose} title="Coupon Details">
      {coupon && (
        <div className="detail-grid">
          <div><span className="detail-label">Date Received</span><p>{coupon.dateReceived}</p></div>
          <div><span className="detail-label">Status</span><p>{coupon.status}</p></div>
          <div><span className="detail-label">Source</span><p>{coupon.source}</p></div>
          <div><span className="detail-label">Sender</span><p>{coupon.sender}</p></div>
          <div><span className="detail-label">Type</span><p>{coupon.type}</p></div>
          <div><span className="detail-label">Promo Title</span><p>{coupon.promoTitle}</p></div>
          <div><span className="detail-label">Code</span><p>{coupon.code}</p></div>
        </div>
      )}
    </Modal>
  );
}