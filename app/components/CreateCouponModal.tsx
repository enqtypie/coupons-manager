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
    type: "LOKE Discount" as const,
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
    calendarInviteCreated: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
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
      type: "LOKE Discount",
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
      calendarInviteCreated: "",
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
            <option value="LOKE Discount">LOKE Discount</option>
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
        <label>End Date (leave blank for no expiry)
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
        <label>Calendar Invite Created
          <input type="date" name="calendarInviteCreated" value={form.calendarInviteCreated} onChange={handleChange} />
        </label>
        <div className="form-actions">
          <button type="button" className="row-action" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Create</button>
        </div>
      </form>
    </Modal>
  );
}