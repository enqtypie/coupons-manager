import {
  LayoutDashboard,
  FileText,
  Tag,
  Flame,
  Settings,
  Percent,
  XCircle,
} from "lucide-react";
import type { NavSection, StatCard, NotifItem, CouponRecord } from "./types";

export const NAV: NavSection[] = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", icon: <LayoutDashboard size={16} />, href: "/dashboard" },
    ],
  },
  {
    section: "Tools",
    items: [
      { label: "Report Generator", icon: <FileText size={16} />, href: "/report-generator" },
      { label: "Coupons Tracker", icon: <Tag size={16} />, href: "/coupons-tracker" },
      { label: "Quarterly Hot Deals", icon: <Flame size={16} />, href: "/hot-deals" },
    ],
  },
  {
    section: "Support",
    items: [{ label: "Settings", icon: <Settings size={16} />, href: "/settings" }],
  },
];

export const STATS: StatCard[] = [
  {
    label: "Active Coupons",
    value: 0,
    sub: "",
    accent: "#378ADD",
    iconBg: "#E6F1FB",
    iconColor: "#185FA5",
    icon: <Tag size={16} />,
    key: "active",
  },
  {
    label: "Expired Coupons",
    value: 0,
    sub: "",
    accent: "#E24B4A",
    iconBg: "#FCEBEB",
    iconColor: "#A32D2D",
    icon: <XCircle size={16} />,
    key: "expired",
  },
  {
    label: "Total Hot Deals",
    value: 0,
    sub: "",
    accent: "#EF9F27",
    iconBg: "#FAEEDA",
    iconColor: "#854F0B",
    icon: <Flame size={16} />,
    key: "hotDeals",
  },
  {
    label: "Total LOKE Discounts",
    value: 0,
    sub: "",
    accent: "#1D9E75",
    iconBg: "#E1F5EE",
    iconColor: "#0F6E56",
    icon: <Percent size={16} />,
    key: "discounts",
  },
];

export const UPCOMING: NotifItem[] = [
  { text: "JETS101 activation", sub: "Jun 16, 2026" },
  { text: "JETS101 deactivation", sub: "Dec 16, 2026" },
  { text: "BOGOVPK0626 activation", sub: "Jun 16, 2026" },
];

export const REMINDERS: NotifItem[] = [
  { text: "Review Q3 Hot Deals setup", sub: "Due Jun 20, 2026" },
  { text: "Confirm PBM926 store IDs", sub: "Due Jun 18, 2026" },
  { text: "Weekly coupon report due", sub: "Due Jun 17, 2026" },
];

export const CHART_LABELS = [
  "Jun 6", "Jun 7", "Jun 8", "Jun 9", "Jun 10",
  "Jun 11", "Jun 12", "Jun 13", "Jun 14", "Jun 15",
];
export const ACTIVATIONS = [22, 38, 45, 41, 72, 28, 55, 62, 48, 96];
export const INQUIRIES = [10, 18, 30, 25, 40, 15, 35, 28, 22, 50];
