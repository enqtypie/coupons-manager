"use client";

import { useState } from "react";
import { Bell, Plus, X } from "lucide-react";

export type ReminderItem = {
  id?: number;
  text: string;
  sub: string;
  removable?: boolean;
  urgent?: boolean;
};

export default function RemindersCard({
  items,
  onAdd,
  onRemove,
}: {
  items: ReminderItem[];
  onAdd: (text: string, dueDate: string) => Promise<void>;
  onRemove: (id: number) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function closeForm() {
    setIsAdding(false);
    setText("");
    setDueDate("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    await onAdd(text.trim(), dueDate);
    setSubmitting(false);
    closeForm();
  }

  return (
    <div className="notif-card">
      <div className="notif-card-header">
        <div className="notif-label" style={{ color: "#854F0B" }}>
          <Bell size={14} />
          Reminders
        </div>
        <button
          type="button"
          className="notif-add-btn"
          onClick={() => setIsAdding((v) => !v)}
          aria-label="Add reminder"
          title="Add reminder"
        >
          <Plus size={14} />
        </button>
      </div>

      {isAdding && (
        <form className="notif-add-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Reminder text..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={255}
            autoFocus
            required
          />
          <div className="notif-add-form-row">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <button type="button" className="row-action" onClick={closeForm}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting || !text.trim()}>
              {submitting ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      )}

      {items.length === 0 && !isAdding ? (
        <p className="notif-empty">No reminders right now.</p>
      ) : (
        <div className="notif-list">
          {items.map((item, i) => (
            <div
              key={item.id ?? i}
              className={`notif-item${item.urgent ? " notif-item--urgent" : ""}${
                i === items.length - 1 ? " notif-item--last" : ""
              }`}
            >
              <span className="notif-dot" style={{ background: "#EF9F27" }} />
              <span className="notif-text">
                {item.text}
                <span className="notif-sub">{item.sub}</span>
              </span>
              {item.removable && item.id !== undefined && (
                <button
                  type="button"
                  className="notif-remove-btn"
                  onClick={() => onRemove(item.id as number)}
                  aria-label="Remove reminder"
                  title="Remove reminder"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
