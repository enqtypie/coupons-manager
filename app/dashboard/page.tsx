import Sidebar from "@/app/components/Sidebar";
import NotifCard from "@/app/components/NotifCard";
import StatCards from "@/app/components/StatCards";
import RequestChart from "@/app/components/RequestChart";
import { UPCOMING, REMINDERS } from "@/app/lib/data";
import "./dashboard.css";

export default function DashboardPage() {
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="notif-row">
          <NotifCard title="Upcoming Events" items={UPCOMING} variant="blue" />
          <NotifCard title="Reminders" items={REMINDERS} variant="amber" />
        </div>
        <StatCards />
        <RequestChart />
      </main>
    </div>
  );
}