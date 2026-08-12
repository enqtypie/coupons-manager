import { Pool, types } from "pg";

// Return DATE/TIMESTAMP columns as raw strings instead of parsed JS Date
// objects, matching the "YYYY-MM-DD" string assumptions used throughout the
// app (sorting, filtering, CSV export, date-range comparisons, etc).
types.setTypeParser(1082, (val) => val); // date
types.setTypeParser(1114, (val) => val); // timestamp without time zone
types.setTypeParser(1184, (val) => val); // timestamp with time zone

declare global {
  var __pgPool: Pool | undefined;
}

export const pool =
  global.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("supabase")
      ? { rejectUnauthorized: false }
      : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

// This app's SQL is written with mysql2-style "?" placeholders throughout;
// translate them to Postgres's positional "$1, $2, ..." here so none of the
// call sites need to change.
function toPositional(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export type ResultHeader = { insertId: number; affectedRows: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T = unknown>(sql: string, params: any[] = []): Promise<T[]> {
  const result = await pool.query(toPositional(sql), params);
  return result.rows as T[];
}

/** For INSERTs that need the new row's id back, add `RETURNING id` to the SQL. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function execute(sql: string, params: any[] = []): Promise<ResultHeader> {
  const result = await pool.query(toPositional(sql), params);
  return {
    insertId: result.rows?.[0]?.id ?? 0,
    affectedRows: result.rowCount ?? 0,
  };
}
