"use client";

import type { CouponRecord, CouponStatus } from "@/app/lib/types";

const STATUS_CLASS: Record<CouponStatus, string> = {
  Active: "status-active",
  Inactive: "status-rejected",
};

export default function CouponsTable({
  couponsrecords = [],
  onView,
  onEdit,
}: {
  couponsrecords: CouponRecord[];
  onView: (coupon: CouponRecord) => void;
  onEdit: (coupon: CouponRecord) => void;
}) {
  return (
    <div className="table-card">
      <p className="table-card-label">Jet's Pizza</p>
      <div className="table-card-scroll">
        <table className="coupons-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Source</th>
              <th>Sender</th>
              <th>Type</th>
              <th>Promo Title</th>
              <th>Code</th>
              <th>Redemption</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Agent</th>
              <th aria-hidden="true"></th>
            </tr>
          </thead>
          <tbody>
            {couponsrecords.map((r) => (
              <tr key={r.id}>
                <td>{r.date}</td>
                <td>
                  <span className={`status-badge ${STATUS_CLASS[r.status]}`}>
                    {r.status}
                  </span>
                </td>
                <td>{r.source}</td>
                <td>{r.sender}</td>
                <td>{r.type}</td>
                <td>{r.promoTitle}</td>
                <td>{r.code}</td>
                <td>{r.redemptionType}</td>
                <td>{r.startDate}</td>
                <td>{r.endDate}</td>
                <td>{r.agentHandling}</td>
                <td>
                  <div className="row-actions">
                    <button className="row-action" type="button" onClick={() => onEdit(r)}>Edit</button>
                    <button className="row-action" type="button" onClick={() => onView(r)}>View</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}