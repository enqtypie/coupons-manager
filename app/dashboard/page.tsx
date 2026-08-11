"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import NotifCard from "@/app/components/NotifCard";
import RemindersCard, { type ReminderItem } from "@/app/components/RemindersCard";
import StatCards from "@/app/components/StatCards";
import RequestChart from "@/app/components/RequestChart";
import type { CouponRecord } from "@/app/lib/types";
import type { ManualReminder } from "@/app/lib/reminder-types";
import { formatDate } from "@/app/lib/date";
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
  const discountsCount = coupons.filter((c) => c.type === "Discount").length;
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

  // Upcoming Events: coupons with a start or end date in the near future (next 60 days)
  const in60Days = new Date();
  in60Days.setDate(in60Days.getDate() + 60);
  const in60DaysStr = in60Days.toISOString().slice(0, 10);

  const upcoming = coupons
    .flatMap((c) => {
      const events = [];
      if (c.startDate && c.startDate >= today && c.startDate <= in60DaysStr) {
        events.push({ text: `${c.code} activation`, sub: formatDate(c.startDate), sortDate: c.startDate });
      }
      if (c.endDate && c.endDate >= today && c.endDate <= in60DaysStr) {
        events.push({ text: `${c.code} deactivation`, sub: formatDate(c.endDate), sortDate: c.endDate });
      }
      return events;
    })
    .sort((a, b) => a.sortDate.localeCompare(b.sortDate))
    .slice(0, 5)
    .map(({ text, sub }) => ({ text, sub }));

// Reminders: urgent sign-off issues first, then day-check/calendar issues, then upcoming activation/deactivation
const in7Days = new Date();
in7Days.setDate(in7Days.getDate() + 7);
const in7DaysStr = in7Days.toISOString().slice(0, 10);

const signOffReminders = coupons
  .filter((c) => !c.agentSignOff)
  .map((c) => ({
    text: `${c.code} — agent sign-off required`,
    sub: c.promoTitle,
    urgent: true,
  }));

const checklistReminders = coupons
  .filter((c) => {
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
      text: `${c.code} — missing ${missing.join(", ")}`,
      sub: c.promoTitle,
      urgent: false,
    };
  });

const activationReminders = coupons
  .filter((c) => c.startDate && c.startDate >= today && c.startDate <= in7DaysStr)
  .map((c) => ({
    text: `${c.code} activating soon`,
    sub: formatDate(c.startDate),
    urgent: false,
  }));

const deactivationReminders = coupons
  .filter((c) => c.endDate && c.endDate >= today && c.endDate <= in7DaysStr)
  .map((c) => ({
    text: `${c.code} deactivating soon`,
    sub: formatDate(c.endDate),
    urgent: false,
  }));

const autoReminders = [
  ...signOffReminders,
  ...checklistReminders,
  ...activationReminders,
  ...deactivationReminders,
].slice(0, 5);

const manualReminderItems: ReminderItem[] = manualReminders.map((r) => ({
  id: r.id,
  text: r.text,
  sub: r.dueDate ? `Due ${formatDate(r.dueDate)}` : "Manual reminder",
  removable: true,
}));

const reminders: ReminderItem[] = [...manualReminderItems, ...autoReminders];

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="notif-row">
          <NotifCard title="Upcoming Events" items={upcoming} variant="blue" />
          <RemindersCard
            items={reminders}
            onAdd={handleAddReminder}
            onRemove={handleRemoveReminder}
          />
        </div>
        {loading ? <p>Loading stats...</p> : <StatCards counts={counts} />}
        <RequestChart />
      </main>
    </div>
  );
}