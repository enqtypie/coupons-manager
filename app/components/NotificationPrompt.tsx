"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { isPushSupported, subscribeToPush } from "@/app/lib/push-client";

const DISMISS_KEY = "notificationPromptDismissed";

export default function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isPushSupported() || Notification.permission !== "default") return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "true") return;
    } catch {
      // ignore — localStorage may be unavailable
    }
    setVisible(true);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // ignore — localStorage may be unavailable
    }
  }

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
        <button type="button" className="notif-prompt-dismiss" onClick={dismiss} aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
