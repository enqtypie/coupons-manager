"use client";

import { useState } from "react";
import type { CouponRecord } from "@/app/lib/types";
import Modal from "./Modal";

export default function CreateCouponModal({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (coupon: CouponRecord) => void;
}) {
  const [form, setForm] = useState({
    dateReceived: "",
    source: "",
    sourceRef: "",
    sender: "",
    type: "",
    promoTitle: "",
    code: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate({
      id: crypto.randomUUID(),
      status: "Pending",
      ...form,
    });
    setForm({ dateReceived: "", source: "", sourceRef: "", sender: "", type: "", promoTitle: "", code: "" });
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Coupon">
      <form className="coupon-form" onSubmit={handleSubmit}>
        <label>Date Received
          <input name="dateReceived" value={form.dateReceived} onChange={handleChange} required />
        </label>
        <label>Source
          <input name="source" value={form.source} onChange={handleChange} required />
        </label>
        <label>Source Ref (optional)
          <input name="sourceRef" value={form.sourceRef} onChange={handleChange} placeholder="e.g. Ticket no. 12345" />
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
          <button type="submit" className="btn-primary">Create</button>
        </div>
      </form>
    </Modal>
  );
}