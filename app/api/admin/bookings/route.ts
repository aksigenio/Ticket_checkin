import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase-server";

function checkAdmin(req: Request): boolean {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) return false;
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token === pwd;
}

export async function GET(req: Request) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }

  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ error: "База данных не настроена." }, { status: 503 });
  }

  const { data, error } = await sb
    .from("bookings")
    .select(
      "id, created_at, row_letter, seat_number, price_eur, first_name, last_name, email, status, receipt_path",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookings: data ?? [] });
}
