"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import NotifCard from "@/app/components/NotifCard";
import StatCards from "@/app/components/StatCards";
import RequestChart from "@/app/components/RequestChart";
import { REMINDERS } from "@/app/lib/data";
import { supabase } from "@/app/lib/supabase";
import { rowToRecord } from "@/app/lib/types";
import type { CouponRecord } from "@/app/lib/types";
import "./dashboard.css";

export default function DashboardPage() {
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCoupons() {
      const { data, error } = await supabase.from("coupons").select("*");
      if (error) {
        console.error("Failed to load dashboard data:", error.message);
      } else {
        setCoupons(data.map(rowToRecord));
      }
      setLoading(false);
    }
    loadCoupons();
  }, []);

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
        events.push({ text: `${c.code} activation`, sub: c.startDate, sortDate: c.startDate });
      }
      if (c.endDate && c.endDate >= today && c.endDate <= in60DaysStr) {
        events.push({ text: `${c.code} deactivation`, sub: c.endDate, sortDate: c.endDate });
      }
      return events;
    })
    .sort((a, b) => a.sortDate.localeCompare(b.sortDate))
    .slice(0, 5)
    .map(({ text, sub }) => ({ text, sub }));

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="notif-row">
          <NotifCard title="Upcoming Events" items={upcoming} variant="blue" />
          <NotifCard title="Reminders" items={REMINDERS} variant="amber" />
        </div>
        {loading ? <p>Loading stats...</p> : <StatCards counts={counts} />}
        <RequestChart />
      </main>
    </div>
  );
}