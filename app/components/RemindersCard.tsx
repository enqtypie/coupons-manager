"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Plus, X } from "lucide-react";

export type ReminderItem = {
  key: string;
  id?: number;
  text: string;
  sub: string;
  removable?: boolean;
  urgent?: boolean;
};

const DISMISSED_STORAGE_KEY = "dashboard.dismissedReminders";
const UNDO_WINDOW_MS = 6000;

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
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Map<string, ReminderItem>>(new Map());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_STORAGE_KEY);
      if (raw) setDismissed(new Set(JSON.parse(raw)));
    } catch {
      // ignore — localStorage may be unavailable
    }
  }, []);

  // Cancel any outstanding dismiss timers if the card unmounts mid-countdown.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  function commitDismiss(item: ReminderItem) {
    if (item.removable && item.id !== undefined) {
      onRemove(item.id);
    } else {
      setDismissed((prev) => {
        const next = new Set(prev);
        next.add(item.key);
        try {
          localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...next]));
        } catch {
          // ignore — localStorage may be unavailable
        }
        return next;
      });
    }
    timersRef.current.delete(item.key);
    setPending((prev) => {
      const next = new Map(prev);
      next.delete(item.key);
      return next;
    });
  }

  function handleDismiss(item: ReminderItem) {
    if (!confirm(`Dismiss "${item.text}"? You can undo this for a few seconds after.`)) return;

    setPending((prev) => new Map(prev).set(item.key, item));
    const timer = setTimeout(() => commitDismiss(item), UNDO_WINDOW_MS);
    timersRef.current.set(item.key, timer);
  }

  function handleUndo(key: string) {
    const timer = timersRef.current.get(key);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(key);
    setPending((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }

  const visibleItems = items.filter((item) => !dismissed.has(item.key) && !pending.has(item.key));

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

      {visibleItems.length === 0 && !isAdding ? (
        <p className="notif-empty">No reminders right now.</p>
      ) : (
        <div className="notif-list">
          {visibleItems.map((item, i) => (
            <div
              key={item.key}
              className={`notif-item${item.urgent ? " notif-item--urgent" : ""}${
                i === visibleItems.length - 1 ? " notif-item--last" : ""
              }`}
            >
              <span className="notif-dot" style={{ background: "#EF9F27" }} />
              <span className="notif-text">
                {item.text}
                <span className="notif-sub">{item.sub}</span>
              </span>
              <button
                type="button"
                className="notif-remove-btn"
                onClick={() => handleDismiss(item)}
                aria-label="Dismiss reminder"
                title="Dismiss"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {pending.size > 0 && (
        <div className="notif-undo-stack">
          {[...pending.values()].map((item) => (
            <div key={item.key} className="notif-undo-toast">
              <span className="notif-undo-text">Dismissed &quot;{item.text}&quot;</span>
              <button type="button" className="notif-undo-btn" onClick={() => handleUndo(item.key)}>
                Undo
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
