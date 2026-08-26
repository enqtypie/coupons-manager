export interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export type StatCard = {
  label: string;
  value: number;
  sub: string;
  accent: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  key: "active" | "expired" | "hotDeals" | "discounts";
};

export interface NotifItem {
  text: string;
  sub: string;
  urgent?: boolean;
  coupon?: CouponRecord;
}

export type CouponStatus = "Active" | "Inactive";
export type CouponSource = "Email" | "Slack" | "Zendesk" | "Basecamp";
export type CouponType = "LOKE Discount" | "Hot Deals";
export type RedemptionType = "Multi" | "Single";
export type AgentHandling = "Mark" | "Noli";

export type CouponRecord = {
  id: number;
  date: string;
  status: CouponStatus;
  source: CouponSource;
  sourceRef?: string;
  sender: string;
  type: CouponType;
  promoTitle: string;
  code: string;
  promoLink: string;
  redemptionType: RedemptionType;
  startDate: string;
  endDate: string;
  participatingStores: string;
  agentHandling: AgentHandling;
  agentSignOff: string;
  startOfDayCheck: string;
  calendarInviteCreated: string;
};

export type CouponRow = {
  id: number;
  date: string;
  status: CouponStatus;
  source: CouponSource;
  source_ref: string | null;
  sender: string;
  type: CouponType;
  promo_title: string;
  code: string;
  promo_link: string | null;
  redemption_type: RedemptionType;
  start_date: string | null;
  end_date: string | null;
  participating_stores: string | null;
  agent_handling: AgentHandling;
  agent_sign_off: string | null;
  start_of_day_check: string | null;
  calendar_invite_created: string | null;
};

export function rowToRecord(row: CouponRow): CouponRecord {
  return {
    id: row.id,
    date: row.date,
    status: row.status,
    source: row.source,
    sourceRef: row.source_ref ?? undefined,
    sender: row.sender,
    type: row.type,
    promoTitle: row.promo_title,
    code: row.code,
    promoLink: row.promo_link ?? "",
    redemptionType: row.redemption_type,
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    participatingStores: row.participating_stores ?? "",
    agentHandling: row.agent_handling,
    agentSignOff: row.agent_sign_off ?? "",
    startOfDayCheck: row.start_of_day_check ?? "",
    calendarInviteCreated: row.calendar_invite_created ?? "",
  };
}