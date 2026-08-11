import { NextResponse } from "next/server";
import { query, execute } from "@/app/lib/db";
import { requireApprovedUser, authErrorResponse } from "@/app/lib/auth-server";

type BatchRow = { id: number; name: string; created_at: string };
type DealRow = { id: number; position: number; kind: "flat" | "band"; name: string; code: string };
type StoreRowRow = {
  id: number;
  store_id: string;
  expiration_date: string | null;
  band_values: string | Record<string, { tier: number | null; price: number | null }> | null;
};

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireApprovedUser();
  } catch (e) {
    return authErrorResponse(e);
  }

  const { id } = await ctx.params;

  const batches = await query<BatchRow>(
    "SELECT id, name, created_at FROM hot_deals_batches WHERE id = ?",
    [id]
  );
  const batch = batches[0];
  if (!batch) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const deals = await query<DealRow>(
    "SELECT id, position, kind, name, code FROM hot_deals_deals WHERE batch_id = ? ORDER BY kind, position",
    [id]
  );
  const storeRowRows = await query<StoreRowRow>(
    "SELECT id, store_id, expiration_date, band_values FROM hot_deals_store_rows WHERE batch_id = ? ORDER BY store_id",
    [id]
  );

  const storeRows = storeRowRows.map((row) => {
    const bandValues =
      typeof row.band_values === "string" ? JSON.parse(row.band_values) : row.band_values ?? {};
    return {
      id: row.id,
      storeId: row.store_id,
      expirationDate: row.expiration_date,
      bandValues: bandValues as Record<string, { tier: number | null; price: number | null }>,
    };
  });

  return NextResponse.json({
    id: batch.id,
    name: batch.name,
    createdAt: batch.created_at,
    flatDeals: deals
      .filter((d) => d.kind === "flat")
      .map((d) => ({ id: d.id, name: d.name, code: d.code })),
    bandDeals: deals
      .filter((d) => d.kind === "band")
      .map((d) => ({ id: d.id, name: d.name, code: d.code })),
    storeRows,
  });
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireApprovedUser();
  } catch (e) {
    return authErrorResponse(e);
  }

  const { id } = await ctx.params;
  await execute("DELETE FROM hot_deals_batches WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
