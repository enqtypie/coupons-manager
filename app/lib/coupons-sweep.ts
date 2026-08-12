import { execute } from "@/app/lib/db";

// Flips any coupon still marked Active to Inactive once its end date has
// arrived. Run this before reads/writes rather than on a schedule, since
// there's no background job runner in this app.
export async function sweepExpiredCoupons(): Promise<void> {
  await execute(
    "UPDATE coupons SET status = 'Inactive' WHERE status = 'Active' AND end_date IS NOT NULL AND end_date <= CURRENT_DATE"
  );
}
