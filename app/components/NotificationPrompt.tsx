"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { isPushSupported, getExistingSubscription, subscribeToPush } from "@/app/lib/push-client";

export default function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function check() {
      // Browser-level permission can't be re-asked once denied — no point
      // showing this if it'll just fail immediately.
      if (!isPushSupported() || Notification.permission === "denied") return;
      // Deliberately no "dismissed forever" flag: this shows every time
      // there's no actual working subscription yet, not just once. A
      // dismiss only hides it for the current page — it comes back on the
      // next login/navigation until subscribing actually succeeds.
      const sub = await getExistingSubscription();
      if (!sub) setVisible(true);
    }
    check();
  }, []);

  async function handleEnable() {
    setBusy(true);
    setError("");
    const result = await subscribeToPush();
    setBusy(false);
    if (result.ok) {
      setVisible(false);
    } else if (result.permissionDenied) {
      // The browser already recorded the decision — nothing more to offer here.
      setVisible(false);
    } else {
      setError(result.error);
    }
  }

  if (!visible) return null;

  return (
    <div className="notif-prompt">
      <Bell size={16} className="notif-prompt-icon" />
      <div className="notif-prompt-body">
        <p className="notif-prompt-text">Get notified on this device when coupons activate or deactivate?</p>
        {error && <p className="notif-prompt-error">{error}</p>}
      </div>
      <div className="notif-prompt-actions">
        <button type="button" className="btn-primary" onClick={handleEnable} disabled={busy}>
          {busy ? "Enabling..." : "Enable"}
        </button>
        <button type="button" className="notif-prompt-dismiss" onClick={() => setVisible(false)} aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
