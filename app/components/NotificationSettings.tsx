"use client";

import { useEffect, useState } from "react";

type Status = "checking" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationSettings() {
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function check() {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const sub = await registration.pushManager.getSubscription();
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
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setBusy(false);
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setError("Push notifications aren't configured yet.");
        setBusy(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // TS's DOM lib wants a concrete ArrayBuffer-backed BufferSource;
        // Uint8Array's generic buffer type (which could be a
        // SharedArrayBuffer) doesn't structurally match even though this one
        // is always a plain ArrayBuffer at runtime.
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      setStatus("subscribed");
    } catch {
      setError("Couldn't enable notifications. Try again.");
    }
    setBusy(false);
  }

  async function handleDisable() {
    setBusy(true);
    setError("");
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch {
      setError("Couldn't disable notifications. Try again.");
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
