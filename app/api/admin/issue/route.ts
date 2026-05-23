import { NextResponse } from "next/server";
import { customerTicketEmail, customerTicketEmailHtml } from "@/lib/email";
import { sendSmtpMail, smtpConfigured } from "@/lib/smtp";
import type { SeatSelection } from "@/lib/seats";
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
  receipt_path: string | null;
};

function toSeatSelection(rows: BookingRow[]): SeatSelection[] {
  return rows
    .map((r) => ({
      row: r.row_letter as SeatSelection["row"],
      seat: r.seat_number,
    }))
    .sort((a, b) => a.row.localeCompare(b.row) || a.seat - b.seat);
}

async function loadBookingGroup(
  sb: NonNullable<ReturnType<typeof getServiceSupabase>>,
  anchor: BookingRow,
): Promise<BookingRow[]> {
  if (anchor.receipt_path) {
    const { data: siblings, error: sibErr } = await sb
      .from("bookings")
      .select("id, email, row_letter, seat_number, status, receipt_path")
      .eq("receipt_path", anchor.receipt_path)
      .eq("status", "pending");

    if (sibErr) {
      throw new Error(sibErr.message);
    }
    const group = (siblings ?? []) as BookingRow[];
    if (group.length > 0) {
      const emails = new Set(group.map((r) => r.email));
      if (emails.size > 1) {
        throw new Error("В заказе разные email — свяжитесь с разработчиком.");
      }
      return group;
    }
  }

  return [anchor];
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
    .select("id, email, row_letter, seat_number, status, receipt_path")
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

  let group: BookingRow[];
  try {
    group = await loadBookingGroup(sb, anchor as BookingRow);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка загрузки заказа.";
    return NextResponse.json({ error: msg }, { status: 500 });
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
