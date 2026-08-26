"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import NotifCard from "@/app/components/NotifCard";
import RemindersCard, { type ReminderItem } from "@/app/components/RemindersCard";
import StatCards from "@/app/components/StatCards";
import RequestChart from "@/app/components/RequestChart";
import ViewCouponModal from "@/app/components/ViewCouponModal";
import type { CouponRecord } from "@/app/lib/types";
import type { ManualReminder } from "@/app/lib/reminder-types";
import { formatDate } from "@/app/lib/date";
import "../coupons-tracker/coupons-tracker.css";
import "./dashboard.css";
import AuthGuard from "../components/AuthGuard";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [manualReminders, setManualReminders] = useState<ManualReminder[]>([]);
  const [viewCoupon, setViewCoupon] = useState<CouponRecord | null>(null);

  useEffect(() => {
    async function loadCoupons() {
      const res = await fetch("/api/coupons", { cache: "no-store" });
      if (!res.ok) {
        console.error("Failed to load dashboard data:", res.statusText);
      } else {
        const data = await res.json();
        setCoupons(data.coupons as CouponRecord[]);
      }
      setLoading(false);
    }
    loadCoupons();
  }, []);

  useEffect(() => {
    async function loadReminders() {
      const res = await fetch("/api/reminders", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setManualReminders(data.reminders as ManualReminder[]);
      }
    }
    loadReminders();
  }, []);

  async function handleAddReminder(text: string, dueDate: string) {
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, dueDate: dueDate || null }),
    });
    if (res.ok) {
      const created = await res.json();
      setManualReminders((prev) => [
        ...prev,
        { id: created.id, text: created.text, dueDate: created.dueDate, createdAt: "" },
      ]);
    }
  }

  async function handleRemoveReminder(id: number) {
    setManualReminders((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
  }

  const today = new Date().toISOString().slice(0, 10);

  const activeCount = coupons.filter((c) => c.status === "Active").length;
  const expiredCount = coupons.filter((c) => c.endDate && c.endDate < today).length;
  const hotDealsCount = coupons.filter((c) => c.type === "Hot Deals").length;
  const discountsCount = coupons.filter((c) => c.type === "LOKE Discount").length;
  const storeSet = new Set(
    coupons.flatMap((c) =>
      (c.participatingStores || "")
        .split(/[,/&]/)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );

  const counts = {
    active: { value: activeCount, sub: "Currently active" },
    expired: { value: expiredCount, sub: "Past end date" },
    hotDeals: { value: hotDealsCount, sub: `Across ${storeSet.size || 0} stores` },
    discounts: { value: discountsCount, sub: "Active this period" },
  };

  // "Near or same day" = today or tomorrow — that's what turns an item red.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  // Upcoming Events: coupons with a start or end date in the near future (next 60 days)
  const in60Days = new Date();
  in60Days.setDate(in60Days.getDate() + 60);
  const in60DaysStr = in60Days.toISOString().slice(0, 10);

  const upcomingEvents = coupons
    .flatMap((c) => {
      const events = [];
      if (c.startDate && c.startDate >= today && c.startDate <= in60DaysStr) {
        events.push({
          text: `${c.code} activation`,
          sub: formatDate(c.startDate),
          sortDate: c.startDate,
          urgent: c.startDate <= tomorrowStr,
          coupon: c,
        });
      }
      if (c.endDate && c.endDate >= today && c.endDate <= in60DaysStr) {
        events.push({
          text: `${c.code} deactivation`,
          sub: formatDate(c.endDate),
          sortDate: c.endDate,
          urgent: c.endDate <= tomorrowStr,
          coupon: c,
        });
      }
      return events;
    })
    .sort((a, b) => a.sortDate.localeCompare(b.sortDate))
    .slice(0, 15);

  const upcoming = upcomingEvents.map(({ text, sub, urgent, coupon }) => ({ text, sub, urgent, coupon }));

  // The calendar marks every coupon activation/deactivation date — past and
  // future — not just the ones in the Upcoming Events list below it.
  const calendarEventsByDate = new Map<string, string[]>();
  for (const c of coupons) {
    if (c.startDate) {
      const list = calendarEventsByDate.get(c.startDate) ?? [];
      list.push(`${c.code} activation`);
      calendarEventsByDate.set(c.startDate, list);
    }
    if (c.endDate) {
      const list = calendarEventsByDate.get(c.endDate) ?? [];
      list.push(`${c.code} deactivation`);
      calendarEventsByDate.set(c.endDate, list);
    }
  }

// Reminders: only for coupons that are still Active — an ended coupon's
// sign-off/checklist is no longer anyone's problem.
const signOffReminders = coupons
  .filter((c) => c.status === "Active" && !c.agentSignOff)
  .map((c) => ({
    key: `signoff-${c.id}`,
    text: `${c.code} — agent sign-off required`,
    sub: c.promoTitle,
    urgent: Boolean(c.startDate && c.startDate <= tomorrowStr),
  }));

const checklistReminders = coupons
  .filter((c) => {
    if (c.status !== "Active") return false;
    const missingDayCheck = !c.startOfDayCheck;
    const missingCalendarInvite = missingDayCheck && !c.calendarInviteCreated;
    return missingDayCheck || missingCalendarInvite;
  })
  .map((c) => {
    const missing: string[] = [];
    if (!c.startOfDayCheck) {
      missing.push("day check");
      if (!c.calendarInviteCreated) missing.push("calendar invite");
    }
    return {
      key: `checklist-${c.id}`,
      text: `${c.code} — missing ${missing.join(", ")}`,
      sub: c.promoTitle,
      urgent: Boolean(c.startDate && c.startDate <= tomorrowStr),
    };
  });

// Activation/deactivation reminders are deliberately left out here — they'd
// just duplicate what's already shown in the Upcoming Events card above.
const autoReminders = [...signOffReminders, ...checklistReminders];

const manualReminderItems: ReminderItem[] = manualReminders.map((r) => ({
  key: `manual-${r.id}`,
  id: r.id,
  text: r.text,
  sub: r.dueDate ? `Due ${formatDate(r.dueDate)}` : "Manual reminder",
  removable: true,
  urgent: Boolean(r.dueDate && r.dueDate <= tomorrowStr),
}));

const reminders: ReminderItem[] = [...manualReminderItems, ...autoReminders].slice(0, 15);

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="dashboard-top">
          <NotifCard
            title="Upcoming Events"
            items={upcoming}
            variant="blue"
            eventsByDate={calendarEventsByDate}
            onItemClick={setViewCoupon}
          />
          <div className="dashboard-right">
            <RemindersCard
              items={reminders}
              onAdd={handleAddReminder}
              onRemove={handleRemoveReminder}
            />
            {loading ? <p>Loading stats...</p> : <StatCards counts={counts} />}
          </div>
        </div>
        <RequestChart />
      </main>

      <ViewCouponModal coupon={viewCoupon} onClose={() => setViewCoupon(null)} />
    </div>
  );
}