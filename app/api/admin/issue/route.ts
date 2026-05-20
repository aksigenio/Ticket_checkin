import { NextResponse } from "next/server";
import type { SeatSelection } from "@/lib/booking-seats";
import { customerTicketEmail, customerTicketEmailHtml } from "@/lib/email";
import { sendSmtpMail, smtpConfigured } from "@/lib/smtp";
import { loadTicketPosterForEmail, POSTER_CID } from "@/lib/ticket-poster";
import { getServiceSupabase } from "@/lib/supabase-server";

function checkAdmin(req: Request): boolean {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) return false;
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token === pwd;
}

type BookingRow = {
  id: string;
  email: string;
  row_letter: string;
  seat_number: number;
  status: string;
  order_id: string | null;
};

function toSeatSelection(rows: BookingRow[]): SeatSelection[] {
  return rows
    .map((r) => ({
      row: r.row_letter as SeatSelection["row"],
      seat: r.seat_number,
    }))
    .sort((a, b) => a.row.localeCompare(b.row) || a.seat - b.seat);
}

export async function POST(req: Request) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }

  const sb = getServiceSupabase();

  if (!sb) {
    return NextResponse.json({ error: "База данных не настроена." }, { status: 503 });
  }
  if (!smtpConfigured()) {
    return NextResponse.json({ error: "Почта не настроена (SMTP_* и ADMIN_EMAIL)." }, { status: 503 });
  }

  let body: { bookingId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON." }, { status: 400 });
  }

  const bookingId = body.bookingId?.trim();
  if (!bookingId) {
    return NextResponse.json({ error: "Укажите bookingId." }, { status: 400 });
  }

  const { data: anchor, error } = await sb
    .from("bookings")
    .select("id, email, row_letter, seat_number, status, order_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!anchor) {
    return NextResponse.json({ error: "Заявка не найдена." }, { status: 404 });
  }
  if (anchor.status === "issued") {
    return NextResponse.json({ error: "Билет(ы) уже были отправлены." }, { status: 409 });
  }
  if (anchor.status !== "pending") {
    return NextResponse.json({ error: "Нельзя выдать билет для этой заявки." }, { status: 400 });
  }

  let group: BookingRow[] = [anchor as BookingRow];

  if (anchor.order_id) {
    const { data: siblings, error: sibErr } = await sb
      .from("bookings")
      .select("id, email, row_letter, seat_number, status, order_id")
      .eq("order_id", anchor.order_id)
      .eq("status", "pending");

    if (sibErr) {
      return NextResponse.json({ error: sibErr.message }, { status: 500 });
    }
    group = (siblings ?? []) as BookingRow[];
    if (group.length === 0) {
      return NextResponse.json({ error: "Заявки заказа не найдены." }, { status: 404 });
    }
    const emails = new Set(group.map((r) => r.email));
    if (emails.size > 1) {
      return NextResponse.json({ error: "В заказе разные email — свяжитесь с разработчиком." }, { status: 500 });
    }
  }

  const seats = toSeatSelection(group);
  const customerEmail = group[0].email as string;

  const { subject, text } = customerTicketEmail({ seats });

  const poster = await loadTicketPosterForEmail();
  const hasPoster = poster !== null;

  const html = customerTicketEmailHtml({
    seats,
    posterCid: POSTER_CID,
    hasPoster,
  });

  const attachments = hasPoster
    ? [
        {
          filename: poster.attachmentFilename,
          content: poster.buffer,
          cid: POSTER_CID,
        },
      ]
    : undefined;

  const { error: mailErr } = await sendSmtpMail({
    to: customerEmail,
    subject,
    text,
    html,
    attachments,
  });

  if (mailErr) {
    return NextResponse.json({ error: mailErr }, { status: 502 });
  }

  const ids = group.map((r) => r.id);
  const { error: upErr } = await sb.from("bookings").update({ status: "issued" }).in("id", ids);

  if (upErr) {
    return NextResponse.json(
      { error: `Письмо отправлено, но статус не обновлён: ${upErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, issuedCount: ids.length });
}
