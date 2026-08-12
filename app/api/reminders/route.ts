import { NextResponse } from "next/server";
import { query, execute } from "@/app/lib/db";
import { requireApprovedUser, authErrorResponse } from "@/app/lib/auth-server";

type ReminderRow = { id: number; text: string; due_date: string | null; created_at: string };

export async function GET() {
  try {
    await requireApprovedUser();
  } catch (e) {
    return authErrorResponse(e);
  }

  const rows = await query<ReminderRow>(
    `SELECT id, text, due_date, created_at FROM manual_reminders
     ORDER BY (due_date IS NULL) ASC, due_date ASC, created_at DESC`
  );

  return NextResponse.json({
    reminders: rows.map((r) => ({
      id: r.id,
      text: r.text,
      dueDate: r.due_date,
      createdAt: r.created_at,
    })),
  });
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireApprovedUser();
  } catch (e) {
    return authErrorResponse(e);
  }

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const dueDate = typeof body?.dueDate === "string" && body.dueDate ? body.dueDate : null;

  if (!text) {
    return NextResponse.json({ error: "Reminder text is required." }, { status: 400 });
  }

  const result = await execute(
    "INSERT INTO manual_reminders (text, due_date, created_by) VALUES (?, ?, ?) RETURNING id",
    [text, dueDate, user.id]
  );

  return NextResponse.json({ id: result.insertId, text, dueDate });
}
