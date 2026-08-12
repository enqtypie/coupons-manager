"use client";

import type { CouponRecord } from "@/app/lib/types";
import { formatDate, formatEndDate } from "@/app/lib/date";
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
          <div><span className="detail-label">Date</span><p>{formatDate(coupon.date)}</p></div>
          <div><span className="detail-label">Status</span><p>{coupon.status}</p></div>
          <div><span className="detail-label">Source</span><p>{coupon.source}</p></div>
          <div><span className="detail-label">Source Ref</span><p>{coupon.sourceRef || "—"}</p></div>
          <div><span className="detail-label">Sender</span><p>{coupon.sender}</p></div>
          <div><span className="detail-label">Type</span><p>{coupon.type}</p></div>
          <div><span className="detail-label">Promo Title</span><p>{coupon.promoTitle}</p></div>
          <div><span className="detail-label">Code</span><p>{coupon.code}</p></div>
          <div><span className="detail-label">Promo Link</span><p>{coupon.promoLink || "—"}</p></div>
          <div><span className="detail-label">Redemption Type</span><p>{coupon.redemptionType}</p></div>
          <div><span className="detail-label">Start Date</span><p>{formatDate(coupon.startDate) || "—"}</p></div>
          <div><span className="detail-label">End Date</span><p>{formatEndDate(coupon.endDate)}</p></div>
          <div><span className="detail-label">Participating Stores</span><p>{coupon.participatingStores || "—"}</p></div>
          <div><span className="detail-label">Agent Handling</span><p>{coupon.agentHandling}</p></div>
          <div><span className="detail-label">Agent Sign Off</span><p>{coupon.agentSignOff || "—"}</p></div>
          <div><span className="detail-label">Start of Day Check</span><p>{formatDate(coupon.startOfDayCheck) || "—"}</p></div>
          <div><span className="detail-label">Calendar Invite Created</span><p>{formatDate(coupon.calendarInviteCreated) || "—"}</p></div>
        </div>
      )}
    </Modal>
  );
}