import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase-server";
import { priceEur } from "@/lib/pricing";
import type { RowLetter } from "@/lib/seats";
import { ROWS } from "@/lib/seats";
import { adminNewBookingEmail } from "@/lib/email";
import { sendSmtpMail, smtpConfigured } from "@/lib/smtp";

const ROW_SET = new Set<RowLetter>(["A", "B", "C", "D", "E", "F", "G", "H"]);

function validSeat(row: RowLetter, seat: number): boolean {
  const meta = ROWS.find((r) => r.label === row);
  return !!meta && meta.seats.includes(seat);
}

export async function POST(req: Request) {
  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json(
      { error: "База данных не настроена. Добавьте переменные Supabase в .env.local." },
      { status: 503 },
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim();

  if (!smtpConfigured() || !adminEmail) {
    return NextResponse.json(
      {
        error:
          "Почта не настроена. Нужны SMTP_HOST, SMTP_USER, SMTP_PASSWORD, ADMIN_EMAIL (см. .env.example).",
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Некорректные данные формы." }, { status: 400 });
  }

  const firstName = String(form.get("firstName") ?? "").trim();
  const lastName = String(form.get("lastName") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const row = String(form.get("row") ?? "").trim().toUpperCase() as RowLetter;
  const seatNum = Number(form.get("seat"));
  const file = form.get("receipt");

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: "Заполните имя, фамилию и email." }, { status: 400 });
  }
  if (!ROW_SET.has(row) || !Number.isInteger(seatNum) || !validSeat(row, seatNum)) {
    return NextResponse.json({ error: "Некорректное место." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Прикрепите чек об оплате." }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Файл слишком большой (макс. 8 МБ)." }, { status: 400 });
  }

  const amount = priceEur(row, seatNum);

  const { data: existing, error: exErr } = await sb
    .from("bookings")
    .select("id")
    .eq("row_letter", row)
    .eq("seat_number", seatNum)
    .in("status", ["pending", "issued"])
    .maybeSingle();

  if (exErr) {
    return NextResponse.json({ error: exErr.message }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json(
      { error: "Это место уже занято или на него оформена заявка." },
      { status: 409 },
    );
  }

  const { data: inserted, error: insErr } = await sb
    .from("bookings")
    .insert({
      row_letter: row,
      seat_number: seatNum,
      price_eur: amount,
      first_name: firstName,
      last_name: lastName,
      email,
      status: "pending",
    })
    .select("id")
    .single();

  if (insErr || !inserted) {
    const code = (insErr as { code?: string } | undefined)?.code;
    if (code === "23505") {
      return NextResponse.json(
        { error: "Это место уже занято или на него оформена заявка." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: insErr?.message ?? "Не удалось сохранить заявку." }, { status: 500 });
  }

  const bookingId = inserted.id as string;
  const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "bin";
  const objectPath = `${bookingId}/receipt.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await sb.storage.from("receipts").upload(objectPath, buf, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });

  if (upErr) {
    await sb.from("bookings").delete().eq("id", bookingId);
    return NextResponse.json({ error: `Загрузка чека: ${upErr.message}` }, { status: 500 });
  }

  const { error: upRowErr } = await sb
    .from("bookings")
    .update({ receipt_path: objectPath })
    .eq("id", bookingId);

  if (upRowErr) {
    await sb.storage.from("receipts").remove([objectPath]);
    await sb.from("bookings").delete().eq("id", bookingId);
    return NextResponse.json({ error: upRowErr.message }, { status: 500 });
  }

  const { data: signed } = await sb.storage.from("receipts").createSignedUrl(objectPath, 60 * 60 * 24 * 7);

  const { subject, text } = adminNewBookingEmail({
    bookingId,
    row,
    seat: seatNum,
    priceEur: amount,
    firstName,
    lastName,
    email,
  });

  const attachments =
    buf.length > 0
      ? [
          {
            filename: file.name || `receipt.${ext}`,
            content: buf,
          },
        ]
      : undefined;

  const { error: mailErr } = await sendSmtpMail({
    to: adminEmail,
    subject,
    text: text + (signed?.signedUrl ? `\n\nСсылка на чек (временная): ${signed.signedUrl}` : ""),
    attachments,
  });

  if (mailErr) {
    return NextResponse.json(
      { error: `Заявка сохранена, но письмо администратору не отправилось: ${mailErr}` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, bookingId });
}
