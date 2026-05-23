import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase-server";
import { customerTicketEmail, customerTicketEmailHtml } from "@/lib/email";
import { sendSmtpMail, smtpConfigured } from "@/lib/smtp";
import { loadTicketPosterForEmail, POSTER_CID } from "@/lib/ticket-poster";

function checkAdmin(req: Request): boolean {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) return false;
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token === pwd;
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

  const { data: row, error } = await sb
    .from("bookings")
    .select("id, email, row_letter, seat_number, status")
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Заявка не найдена." }, { status: 404 });
  }
  if (row.status === "issued") {
    return NextResponse.json({ error: "Билет уже был отправлен." }, { status: 409 });
  }
  if (row.status !== "pending") {
    return NextResponse.json({ error: "Нельзя выдать билет для этой заявки." }, { status: 400 });
  }

  const rowLetter = row.row_letter as string;
  const seatNum = row.seat_number as number;

  const { subject, text } = customerTicketEmail({
    row: rowLetter,
    seat: seatNum,
  });

  const poster = await loadTicketPosterForEmail();
  const hasPoster = poster !== null;

  const html = customerTicketEmailHtml({
    row: rowLetter,
    seat: seatNum,
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
    to: row.email as string,
    subject,
    text,
    html,
    attachments,
  });

  if (mailErr) {
    return NextResponse.json({ error: mailErr }, { status: 502 });
  }

  const { error: upErr } = await sb.from("bookings").update({ status: "issued" }).eq("id", bookingId);

  if (upErr) {
    return NextResponse.json(
      { error: `Письмо отправлено, но статус не обновлён: ${upErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
