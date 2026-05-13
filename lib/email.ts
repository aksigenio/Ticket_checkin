const VENUE_BLOCK = `Boutique da Cultura
Espaço Boutique da Cultura, Av. Colégio Militar, em frente Rua Adelaide Cabete, 1500-187 Lisboa, Portugal`;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function adminNewBookingEmail(opts: {
  bookingId: string;
  row: string;
  seat: number;
  priceEur: number;
  firstName: string;
  lastName: string;
  email: string;
}) {
  const subject = `Заявка на билет, FILA ${opts.row}, место ${opts.seat}`;
  const text = [
    `ID заявки: ${opts.bookingId}`,
    `Место: FILA ${opts.row}, место ${opts.seat}`,
    `Цена: ${opts.priceEur}€`,
    `Имя: ${opts.firstName}`,
    `Фамилия: ${opts.lastName}`,
    `Email покупателя: ${opts.email}`,
    "",
    'Проверьте оплату на IBAN, потом в админке нажмите "Отправить билет".',
  ].join("\n");
  return { subject, text };
}

export function customerTicketEmail(opts: { row: string; seat: number }) {
  const subject = `Билет, "Мир Дверь Мяч", FILA ${opts.row}, место ${opts.seat}`;
  const text = [
    "Спасибо, что купили билет.",
    "",
    "Спектакль \"Мир Дверь Мяч\" (Peace Door Ball).",
    `Место: ряд ${opts.row}, номер ${opts.seat}.`,
    "",
    "Дата: 22 июня 2026, время: 20:00",
    "",
    "Адрес:",
    VENUE_BLOCK,
    "",
    "До встречи!",
  ].join("\n");
  return { subject, text };
}

/** HTML-версия письма; при hasPoster вложение с тем же cid должно быть в письме. */
export function customerTicketEmailHtml(opts: {
  row: string;
  seat: number;
  posterCid: string;
  hasPoster: boolean;
}): string {
  const rowE = esc(opts.row);
  const venueHtml = VENUE_BLOCK.split("\n")
    .map((line) => esc(line))
    .join("<br/>");
  const posterBlock = opts.hasPoster
    ? `<p style="margin:20px 0 0"><img src="cid:${opts.posterCid}" alt="Мир Дверь Мяч" width="560" style="max-width:100%;height:auto;border-radius:10px;display:block" /></p>`
    : "";

  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.55;color:#1a1814;background:#f4efe4;">
  <p>Спасибо, что купили билет.</p>
  <p><strong>"Мир Дверь Мяч"</strong> (Peace Door Ball)<br/>
  Место: ряд <strong>${rowE}</strong>, номер <strong>${opts.seat}</strong>.</p>
  <p>Дата: <strong>22 июня 2026</strong>, время: <strong>20:00</strong></p>
  <p style="margin-top:12px">Адрес:<br/>${venueHtml}</p>
  ${posterBlock}
  <p style="margin-top:20px">До встречи!</p>
</body>
</html>`;
}
