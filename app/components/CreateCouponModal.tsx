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
  onCreate: (form: Omit<CouponRecord, "id">) => void;
}) {
  const [form, setForm] = useState({
    date: "",
    status: "Active" as const,
    source: "Email" as const,
    sourceRef: "",
    sender: "",
    type: "Discount" as const,
    promoTitle: "",
    code: "",
    promoLink: "",
    redemptionType: "Single" as const,
    startDate: "",
    endDate: "",
    participatingStores: "",
    agentHandling: "Mark" as const,
    agentSignOff: "",
    startOfDayCheck: "",
    calendarInviteCreated: false,
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate(form);
    setForm({
      date: "",
      status: "Active",
      source: "Email",
      sourceRef: "",
      sender: "",
      type: "Discount",
      promoTitle: "",
      code: "",
      promoLink: "",
      redemptionType: "Single",
      startDate: "",
      endDate: "",
      participatingStores: "",
      agentHandling: "Mark",
      agentSignOff: "",
      startOfDayCheck: "",
      calendarInviteCreated: false,
    });
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Coupon">
      <form className="coupon-form" onSubmit={handleSubmit}>
        <label>Date
          <input type="date" name="date" value={form.date} onChange={handleChange} required />
        </label>
        <label>Status
          <select name="status" value={form.status} onChange={handleChange} required>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>
        <label>Source
          <select name="source" value={form.source} onChange={handleChange} required>
            <option value="Email">Email</option>
            <option value="Slack">Slack</option>
            <option value="Zendesk">Zendesk</option>
            <option value="Basecamp">Basecamp</option>
          </select>
        </label>
        <label>Source Ref (optional)
          <input name="sourceRef" value={form.sourceRef} onChange={handleChange} placeholder="e.g. Ticket no. 12345" />
        </label>
        <label>Sender
          <input name="sender" value={form.sender} onChange={handleChange} required />
        </label>
        <label>Type
          <select name="type" value={form.type} onChange={handleChange} required>
            <option value="Discount">Discount</option>
            <option value="Hot Deals">Hot Deals</option>
          </select>
        </label>
        <label>Promo Title
          <input name="promoTitle" value={form.promoTitle} onChange={handleChange} required />
        </label>
        <label>Code
          <input name="code" value={form.code} onChange={handleChange} required />
        </label>
        <label>Promo Link
          <input name="promoLink" value={form.promoLink} onChange={handleChange} placeholder="https://..." />
        </label>
        <label>Redemption Type
          <select name="redemptionType" value={form.redemptionType} onChange={handleChange} required>
            <option value="Single">Single</option>
            <option value="Multi">Multi</option>
          </select>
        </label>
        <label>Start Date
          <input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
        </label>
        <label>End Date
          <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
        </label>
        <label>Participating Stores
          <input name="participatingStores" value={form.participatingStores} onChange={handleChange} />
        </label>
        <label>Agent Handling
          <select name="agentHandling" value={form.agentHandling} onChange={handleChange} required>
            <option value="Mark">Mark</option>
            <option value="Noli">Noli</option>
          </select>
        </label>
        <label>Agent Sign Off
          <input name="agentSignOff" value={form.agentSignOff} onChange={handleChange} />
        </label>
        <label>Start of Day Check
          <input type="date" name="startOfDayCheck" value={form.startOfDayCheck} onChange={handleChange} />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" name="calendarInviteCreated" checked={form.calendarInviteCreated} onChange={handleChange} />
          Calendar Invite Created
        </label>
        <div className="form-actions">
          <button type="button" className="row-action" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Create</button>
        </div>
      </form>
    </Modal>
  );
}