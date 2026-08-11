import { NextResponse } from "next/server";
import { query, execute } from "@/app/lib/db";
import { requireApprovedUser, authErrorResponse } from "@/app/lib/auth-server";
import { parseHotDealsCsv, type ParsedStoreRow } from "@/app/lib/hot-deals-csv";

type BatchSummaryRow = { id: number; name: string; created_at: string; store_count: number };

export async function GET() {
  try {
    await requireApprovedUser();
  } catch (e) {
    return authErrorResponse(e);
  }

  const batches = await query<BatchSummaryRow>(
    `SELECT b.id, b.name, b.created_at,
            (SELECT COUNT(*) FROM hot_deals_store_rows r WHERE r.batch_id = b.id) AS store_count
     FROM hot_deals_batches b
     ORDER BY b.created_at DESC`
  );

  return NextResponse.json({
    batches: batches.map((b) => ({
      id: b.id,
      name: b.name,
      createdAt: b.created_at,
      storeCount: b.store_count,
    })),
  });
}

async function insertStoreRows(
  batchId: number,
  storeRows: ParsedStoreRow[],
  bandDealIds: number[]
) {
  if (storeRows.length === 0) return;

  const placeholders = storeRows.map(() => "(?, ?, ?, ?)").join(", ");
  const params: unknown[] = [];

  for (const row of storeRows) {
    const bandValuesByDealId: Record<number, { tier: number | null; price: number | null }> = {};
    row.bandValues.forEach((value, idx) => {
      const dealId = bandDealIds[idx];
      if (dealId !== undefined && (value.tier !== null || value.price !== null)) {
        bandValuesByDealId[dealId] = value;
      }
    });
    params.push(batchId, row.storeId, row.expirationDate, JSON.stringify(bandValuesByDealId));
  }

  await execute(
    `INSERT INTO hot_deals_store_rows (batch_id, store_id, expiration_date, band_values) VALUES ${placeholders}`,
    params
  );
}

export async function POST(request: Request) {
  try {
    await requireApprovedUser();
  } catch (e) {
    return authErrorResponse(e);
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const csv = typeof body?.csv === "string" ? body.csv : "";

  if (!name) {
    return NextResponse.json(
      { error: 'A name is required (e.g. "Q3 Hot Deals").' },
      { status: 400 }
    );
  }
  if (!csv) {
    return NextResponse.json({ error: "A CSV file is required." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseHotDealsCsv(csv);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not parse the CSV.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const batchResult = await execute("INSERT INTO hot_deals_batches (name) VALUES (?)", [name]);
  const batchId = batchResult.insertId;

  for (const deal of parsed.flatDeals) {
    await execute(
      "INSERT INTO hot_deals_deals (batch_id, position, kind, name, code) VALUES (?, ?, 'flat', ?, ?)",
      [batchId, deal.position, deal.name, deal.code]
    );
  }

  const bandDealIds: number[] = [];
  for (const deal of parsed.bandDeals) {
    const result = await execute(
      "INSERT INTO hot_deals_deals (batch_id, position, kind, name, code) VALUES (?, ?, 'band', ?, ?)",
      [batchId, deal.position, deal.name, deal.code]
    );
    bandDealIds.push(result.insertId);
  }

  await insertStoreRows(batchId, parsed.storeRows, bandDealIds);

  return NextResponse.json({ id: batchId, name, storeCount: parsed.storeRows.length });
}
