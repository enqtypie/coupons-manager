// Parses the Quarterly Hot Deals CSV format:
//   StoreID, <name>, <code>,  ...(more flat name/code pairs)...,
//   Band, <name>, <code>,  ...(more Band/name/code groups)...,
//   Expiration Date
// A flat name/code pair (before the first "Band" marker) is a storewide
// code with no per-store data. A "Band" marker starts a 3-column group
// (tier, price, code) that does vary per store. The set of deals is
// re-detected from the header on every import since it changes each quarter.

const LAST_HEADER_LABEL = "expiration date";

export type ParsedDeal = { position: number; name: string; code: string };

export type ParsedStoreRow = {
  storeId: string;
  expirationDate: string | null;
  bandValues: Array<{ tier: number | null; price: number | null }>;
};

export type ParsedHotDealsCsv = {
  flatDeals: ParsedDeal[];
  bandDeals: ParsedDeal[];
  storeRows: ParsedStoreRow[];
};

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseMoney(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const num = Number(trimmed.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(num) ? num : null;
}

function parseTier(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

function parseUsDate(raw: string): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw.trim());
  if (!match) return null;
  const [, month, day, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function parseHotDealsCsv(csvText: string): ParsedHotDealsCsv {
  const lines = csvText.split(/\r\n|\r|\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error("The CSV needs a header row and at least one store row.");
  }

  const header = splitCsvLine(lines[0]);
  if (header.length < 3) {
    throw new Error("The CSV header doesn't look right — too few columns.");
  }
  if (header[0].toLowerCase() !== "storeid") {
    throw new Error('The first column must be "StoreID".');
  }
  if (header[header.length - 1].toLowerCase() !== LAST_HEADER_LABEL) {
    throw new Error('The last column must be "Expiration Date".');
  }

  const flatDeals: ParsedDeal[] = [];
  const bandDeals: ParsedDeal[] = [];
  const groups: Array<{ start: number; kind: "flat" | "band" }> = [];

  const dealEnd = header.length - 1; // everything up to (not including) Expiration Date
  let i = 1;
  while (i < dealEnd) {
    if (header[i].toLowerCase() === "band") {
      if (i + 2 >= dealEnd) {
        throw new Error(`Malformed "Band" group starting at column ${i + 1}.`);
      }
      bandDeals.push({ position: bandDeals.length, name: header[i + 1], code: header[i + 2] });
      groups.push({ start: i, kind: "band" });
      i += 3;
    } else {
      if (i + 1 >= dealEnd) {
        throw new Error(`Malformed deal column starting at column ${i + 1}.`);
      }
      flatDeals.push({ position: flatDeals.length, name: header[i], code: header[i + 1] });
      groups.push({ start: i, kind: "flat" });
      i += 2;
    }
  }

  if (bandDeals.length === 0 && flatDeals.length === 0) {
    throw new Error("No deal columns were found between StoreID and Expiration Date.");
  }

  const storeRows: ParsedStoreRow[] = [];
  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const cells = splitCsvLine(lines[lineIndex]);
    if (cells.length < header.length) continue;
    const storeId = cells[0];
    if (!storeId) continue;

    const bandValues: Array<{ tier: number | null; price: number | null }> = [];
    for (const group of groups) {
      if (group.kind !== "band") continue;
      bandValues.push({
        tier: parseTier(cells[group.start]),
        price: parseMoney(cells[group.start + 1]),
      });
    }

    storeRows.push({
      storeId,
      expirationDate: parseUsDate(cells[header.length - 1]),
      bandValues,
    });
  }

  if (storeRows.length === 0) {
    throw new Error("No store rows were found in the CSV.");
  }

  return { flatDeals, bandDeals, storeRows };
}
