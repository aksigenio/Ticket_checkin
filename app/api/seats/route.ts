import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase-server";

export async function GET() {
  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ keys: [] as string[] });
  }

  const { data, error } = await sb
    .from("bookings")
    .select("row_letter, seat_number")
    .in("status", ["pending", "issued"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const keys =
    data?.map((r) => `${r.row_letter}-${r.seat_number}` as string) ?? [];
  return NextResponse.json({ keys });
}
