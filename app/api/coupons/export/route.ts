import { NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import { requireApprovedUser, authErrorResponse } from "@/app/lib/auth-server";
import { rowToRecord, type CouponRow, type CouponRecord } from "@/app/lib/types";
import { formatDate, formatEndDate } from "@/app/lib/date";

type DateField = "request" | "activation";

const CSV_COLUMNS: { header: string; get: (c: CouponRecord) => string }[] = [
  { header: "Date", get: (c) => formatDate(c.date) },
  { header: "Status", get: (c) => c.status },
  { header: "Source", get: (c) => c.source },
  { header: "Source Ref", get: (c) => c.sourceRef ?? "" },
  { header: "Sender", get: (c) => c.sender },
  { header: "Type", get: (c) => c.type },
  { header: "Promo Title", get: (c) => c.promoTitle },
  { header: "Code", get: (c) => c.code },
  { header: "Promo Link", get: (c) => c.promoLink },
  { header: "Redemption Type", get: (c) => c.redemptionType },
  { header: "Start Date", get: (c) => formatDate(c.startDate) },
  { header: "End Date", get: (c) => formatEndDate(c.endDate) },
  { header: "Participating Stores", get: (c) => c.participatingStores },
  { header: "Agent Handling", get: (c) => c.agentHandling },
  { header: "Agent Sign Off", get: (c) => c.agentSignOff },
  { header: "Start of Day Check", get: (c) => formatDate(c.startOfDayCheck) },
  { header: "Calendar Invite Created", get: (c) => formatDate(c.calendarInviteCreated) },
];

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(records: CouponRecord[]): string {
  const lines = [CSV_COLUMNS.map((c) => csvEscape(c.header)).join(",")];
  for (const record of records) {
    lines.push(CSV_COLUMNS.map((c) => csvEscape(c.get(record))).join(","));
  }
  return lines.join("\r\n");
}

function buildWhere(searchParams: URLSearchParams) {
  const dateField: DateField = searchParams.get("dateField") === "activation" ? "activation" : "request";
  const from = searchParams.get("from")?.trim() || "";
  const to = searchParams.get("to")?.trim() || "";
  const locations = (searchParams.get("locations") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const where: string[] = [];
  const params: unknown[] = [];

  if (dateField === "activation") {
    if (from && to) {
      where.push("start_date <= ? AND end_date >= ?");
      params.push(to, from);
    } else if (from) {
      where.push("end_date >= ?");
      params.push(from);
    } else if (to) {
      where.push("start_date <= ?");
      params.push(to);
    }
  } else {
    if (from && to) {
      where.push("date BETWEEN ? AND ?");
      params.push(from, to);
    } else if (from) {
      where.push("date >= ?");
      params.push(from);
    } else if (to) {
      where.push("date <= ?");
      params.push(to);
    }
  }

  if (locations.length > 0) {
    where.push(`(${locations.map(() => "participating_stores LIKE ?").join(" OR ")})`);
    for (const loc of locations) params.push(`%${loc}%`);
  }

  return { whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "", params, from, to, locations };
}

export async function GET(request: Request) {
  try {
    await requireApprovedUser();
  } catch (e) {
    return authErrorResponse(e);
  }

  const { searchParams } = new URL(request.url);
  const { whereSql, params, from, to, locations } = buildWhere(searchParams);

  if (searchParams.get("format") === "count") {
    const rows = await query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM coupons ${whereSql}`,
      params
    );
    return NextResponse.json({ total: rows[0]?.total ?? 0 });
  }

  const rows = await query<CouponRow>(`SELECT * FROM coupons ${whereSql} ORDER BY date ASC`, params);
  const csv = toCsv(rows.map(rowToRecord));

  const filenameParts = ["coupon-report"];
  if (from || to) filenameParts.push(`${from || "start"}_to_${to || "end"}`);
  if (locations.length) filenameParts.push("filtered-locations");
  const filename = `${filenameParts.join("-")}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
