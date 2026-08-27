"use client";

import { useEffect, useState } from "react";
import { isPushSupported, getExistingSubscription, subscribeToPush, unsubscribeFromPush } from "@/app/lib/push-client";

type Status = "checking" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

export default function NotificationSettings() {
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function check() {
      if (!isPushSupported()) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      try {
        const sub = await getExistingSubscription();
        setStatus(sub ? "subscribed" : "unsubscribed");
      } catch {
        setStatus("unsupported");
      }
    }
    check();
  }, []);

  async function handleEnable() {
    setBusy(true);
    setError("");
    const result = await subscribeToPush();
    if (result.ok) {
      setStatus("subscribed");
    } else {
      setError(result.error);
      if (result.permissionDenied) setStatus("denied");
    }
    setBusy(false);
  }

  async function handleDisable() {
    setBusy(true);
    setError("");
    const result = await unsubscribeFromPush();
    if (result.ok) {
      setStatus("unsubscribed");
    } else {
      setError(result.error);
    }
    setBusy(false);
  }

  return (
    <section className="settings-section">
      <h2 className="settings-section-title">Notifications</h2>
      <p className="settings-section-sub">
        Get a notification on this device the day before and the day of a coupon&apos;s activation or deactivation.
      </p>

      {status === "checking" && <p className="settings-empty">Checking...</p>}
      {status === "unsupported" && (
        <p className="settings-empty">Notifications aren&apos;t supported in this browser.</p>
      )}
      {status === "denied" && (
        <p className="settings-empty">
          Notifications are blocked for this site. Allow them in your browser&apos;s site settings, then reload
          this page.
        </p>
      )}
      {(status === "subscribed" || status === "unsubscribed") && (
        <button
          type="button"
          className="btn-primary"
          onClick={status === "subscribed" ? handleDisable : handleEnable}
          disabled={busy}
        >
          {busy
            ? "Please wait..."
            : status === "subscribed"
            ? "Disable notifications on this device"
            : "Enable notifications on this device"}
        </button>
      )}
      {error && <p className="settings-error">{error}</p>}
    </section>
  );
}
