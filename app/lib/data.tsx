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
    value: 430,
    sub: "↑ 12 this week",
    accent: "#378ADD",
    iconBg: "#E6F1FB",
    iconColor: "#185FA5",
    icon: <Tag size={16} />,
  },
  {
    label: "Expired Coupons",
    value: 430,
    sub: "↓ 4 vs last week",
    accent: "#E24B4A",
    iconBg: "#FCEBEB",
    iconColor: "#A32D2D",
    icon: <XCircle size={16} />,
  },
  {
    label: "Total Hot Deals",
    value: 430,
    sub: "Across 48 stores",
    accent: "#EF9F27",
    iconBg: "#FAEEDA",
    iconColor: "#854F0B",
    icon: <Flame size={16} />,
  },
  {
    label: "Total Discounts",
    value: 430,
    sub: "Active this period",
    accent: "#1D9E75",
    iconBg: "#E1F5EE",
    iconColor: "#0F6E56",
    icon: <Percent size={16} />,
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

export const SAMPLE_COUPONS: CouponRecord[] = [
  {
    id: "c1",
    dateReceived: "Jun 12, 2026",
    status: "Active",
    source: "Email",
    sourceRef: "Coupon Codes - FL-005 & FL-033",
    sender: "Steve",
    type: "Hot Deals",
    promoTitle: "Buy One Get One Free",
    code: "BOGOVPK0626",
  },
  {
  id: "c2",
  dateReceived: "Jun 11, 2026",
  status: "Pending",
  source: "Zendesk",
  sourceRef: "Ticket no. 12345",
  sender: "Steve",
  type: "Loke Discount",
  promoTitle: "20% Off Large Pizzas",
  code: "JETS101",
},
  {
    id: "c3",
    dateReceived: "Jun 9, 2026",
    status: "Expired",
    source: "Slack",
    sourceRef: "Coupons Team Channel",
    sender: "Rob",
    type: "Loke Discount",
    promoTitle: "$5 Off Orders Over $25",
    code: "PBM926",
  },
  {
    id: "c4",
    dateReceived: "Jun 8, 2026",
    status: "Rejected",
    source: "Email",
    sourceRef: "FAMDEAL Request",
    sender: "Andy",
    type: "Hot Deals",
    promoTitle: "Family Deal Bundle",
    code: "FAMBNDL26",
  },
];