export interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export interface StatCard {
  label: string;
  value: number;
  sub: string;
  accent: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}

export interface NotifItem {
  text: string;
  sub: string;
}

export type CouponStatus = "Active" | "Pending" | "Expired" | "Rejected";

export type CouponRecord = {
  id: string;
  dateReceived: string;
  status: CouponStatus;
  source: string;       // e.g. "Zendesk"
  sourceRef?: string;   // e.g. "Ticket no. 12345"
  sender: string;
  type: string;
  promoTitle: string;
  code: string;
};