"use client";

import { useEffect, useState } from "react";
import type { CouponRecord, CouponStatus } from "@/app/lib/types";
import Modal from "./Modal";

const STATUS_OPTIONS: CouponStatus[] = ["Active", "Pending", "Expired", "Rejected"];

export default function EditCouponModal({
  coupon,
  onClose,
  onSave,
}: {
  coupon: CouponRecord | null;
  onClose: () => void;
  onSave: (coupon: CouponRecord) => void;
}) {
  const [form, setForm] = useState<CouponRecord | null>(coupon);

  // Sync form state whenever a new coupon is passed in for editing
  useEffect(() => {
    setForm(coupon);
  }, [coupon]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    if (!form) return;
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    onSave(form);
    onClose();
  }

  return (
    <Modal isOpen={!!coupon} onClose={onClose} title="Edit Coupon">
      {form && (
        <form className="coupon-form" onSubmit={handleSubmit}>
          <label>Date Received
            <input name="dateReceived" value={form.dateReceived} onChange={handleChange} required />
          </label>
          <label>Status
            <select name="status" value={form.status} onChange={handleChange} required>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>Source
            <input name="source" value={form.source} onChange={handleChange} required />
          </label>
          <label>Source Ref (optional)
            <input name="sourceRef" value={form.sourceRef ?? ""} onChange={handleChange} />
          </label>
          <label>Sender
            <input name="sender" value={form.sender} onChange={handleChange} required />
          </label>
          <label>Type
            <input name="type" value={form.type} onChange={handleChange} required />
          </label>
          <label>Promo Title
            <input name="promoTitle" value={form.promoTitle} onChange={handleChange} required />
          </label>
          <label>Code
            <input name="code" value={form.code} onChange={handleChange} required />
          </label>
          <div className="form-actions">
            <button type="button" className="row-action" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      )}
    </Modal>
  );
}