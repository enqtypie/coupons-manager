"use client";

import { useState } from "react";
import Modal from "@/app/components/Modal";
import type { HotDealsBatchSummary } from "@/app/lib/hot-deals-types";

export default function ImportHotDealsModal({
  isOpen,
  onClose,
  onImported,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImported: (batch: HotDealsBatchSummary) => void;
}) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleClose() {
    setName("");
    setFile(null);
    setError("");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a CSV file to import.");
      return;
    }
    setSubmitting(true);
    setError("");

    const csv = await file.text();
    const res = await fetch("/api/hot-deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, csv }),
    });
    const data = await res.json().catch(() => null);
    setSubmitting(false);

    if (!res.ok) {
      setError(data?.error ?? "Failed to import the CSV.");
      return;
    }

    onImported({ id: data.id, name: data.name, createdAt: "", storeCount: data.storeCount });
    handleClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Quarterly Hot Deals">
      <form className="coupon-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q3 Hot Deals"
            required
          />
        </label>
        <label>
          CSV File
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </label>
        {error && <p className="hotdeals-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="row-action" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Importing..." : "Import"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
