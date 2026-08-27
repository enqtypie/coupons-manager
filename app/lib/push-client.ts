"use client";

// Shared browser-side push subscribe/unsubscribe logic, used by both the
// manual toggle in Settings and the post-login prompt banner.

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

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.register("/sw.js");
  return registration.pushManager.getSubscription();
}

export type PushResult = { ok: true } | { ok: false; error: string; permissionDenied?: boolean };

export async function subscribeToPush(): Promise<PushResult> {
  if (!isPushSupported()) {
    return { ok: false, error: "Notifications aren't supported in this browser." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Notification permission was not granted.", permissionDenied: true };
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return { ok: false, error: "Push notifications aren't configured yet." };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // TS's DOM lib wants a concrete ArrayBuffer-backed BufferSource;
      // Uint8Array's generic buffer type (which could be a
      // SharedArrayBuffer) doesn't structurally match even though this one
      // is always a plain ArrayBuffer at runtime.
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      await sub.unsubscribe();
      return { ok: false, error: data?.error ?? `Couldn't save the subscription (server said ${res.status}).` };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't enable notifications. Try again." };
  }
}

export async function unsubscribeFromPush(): Promise<PushResult> {
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
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't disable notifications. Try again." };
  }
}
