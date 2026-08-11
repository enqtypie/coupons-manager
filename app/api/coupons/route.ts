import { NextResponse } from "next/server";
import { query, execute } from "@/app/lib/db";
import { requireApprovedUser, authErrorResponse } from "@/app/lib/auth-server";
import { rowToRecord, type CouponRow } from "@/app/lib/types";

export async function GET(request: Request) {
  try {
    await requireApprovedUser();
  } catch (e) {
    return authErrorResponse(e);
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const filter = searchParams.get("filter") ?? "All";
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");

  const where: string[] = [];
  const params: unknown[] = [];

  if (search) {
    const pattern = `%${search}%`;
    where.push(
      "(promo_title LIKE ? OR code LIKE ? OR sender LIKE ? OR source_ref LIKE ? OR agent_sign_off LIKE ? OR participating_stores LIKE ?)"
    );
    params.push(pattern, pattern, pattern, pattern, pattern, pattern);
  }

  if (filter === "Active" || filter === "Inactive") {
    where.push("status = ?");
    params.push(filter);
  }

  let orderBy = "created_at DESC";
  if (filter === "Alphabetical") orderBy = "promo_title ASC";
  else if (filter === "Start Date") orderBy = "start_date ASC";
  else if (filter === "End Date") orderBy = "end_date ASC";

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countRows = await query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM coupons ${whereSql}`,
    params
  );
  const total = countRows[0]?.total ?? 0;

  let sql = `SELECT * FROM coupons ${whereSql} ORDER BY ${orderBy}`;
  const listParams = [...params];

  if (pageParam && pageSizeParam) {
    const page = Math.max(1, Number(pageParam) || 1);
    const pageSize = Math.max(1, Number(pageSizeParam) || 50);
    sql += " LIMIT ? OFFSET ?";
    listParams.push(pageSize, (page - 1) * pageSize);
  }

  const rows = await query<CouponRow>(sql, listParams);
  return NextResponse.json({ coupons: rows.map(rowToRecord), total });
}

export async function POST(request: Request) {
  try {
    await requireApprovedUser();
  } catch (e) {
    return authErrorResponse(e);
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = await execute(
    `INSERT INTO coupons
      (date, status, source, source_ref, sender, type, promo_title, code, promo_link,
       redemption_type, start_date, end_date, participating_stores, agent_handling,
       agent_sign_off, start_of_day_check, calendar_invite_created)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      body.date,
      body.status,
      body.source,
      body.sourceRef || null,
      body.sender,
      body.type,
      body.promoTitle,
      body.code,
      body.promoLink || null,
      body.redemptionType,
      body.startDate || null,
      body.endDate || null,
      body.participatingStores || null,
      body.agentHandling,
      body.agentSignOff || null,
      body.startOfDayCheck || null,
      Boolean(body.calendarInviteCreated),
    ]
  );

  return NextResponse.json({ id: result.insertId });
}
