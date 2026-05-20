import type { SeatSelection } from "@/lib/booking-seats";
import { formatSeatList } from "@/lib/booking-seats";

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
  orderId: string;
  bookingIds: string[];
  seats: SeatSelection[];
  totalEur: number;
  firstName: string;
  lastName: string;
  email: string;
}) {
  const seatLines = formatSeatList(opts.seats);
  const count = opts.seats.length;
  const subject =
    count === 1
      ? `Заявка на билет, ${seatLines}`
      : `Заявка на ${count} билета, ${seatLines}`;
  const text = [
    `ID заказа: ${opts.orderId}`,
    `ID заявок: ${opts.bookingIds.join(", ")}`,
    `Места: ${seatLines}`,
    `Сумма: ${opts.totalEur}€`,
    `Имя: ${opts.firstName}`,
    `Фамилия: ${opts.lastName}`,
    `Email покупателя: ${opts.email}`,
    "",
    'Проверьте оплату (IBAN или Revolut @a_khudiakov), потом в админке нажмите "Отправить билет".',
  ].join("\n");
  return { subject, text };
}

export function customerTicketEmail(opts: { seats: SeatSelection[] }) {
  const seatLines = formatSeatList(opts.seats);
  const count = opts.seats.length;
  const subject =
    count === 1
      ? `Билет, "Мир Дверь Мяч", ${seatLines}`
      : `Билеты (${count}), "Мир Дверь Мяч", ${seatLines}`;
  const placesBlock =
    count === 1
      ? `Место: ${seatLines.replace("FILA ", "ряд ").replace(", место ", ", номер ")}.`
      : ["Места:", ...opts.seats.map((s) => `- ряд ${s.row}, номер ${s.seat}`)].join("\n");
  const text = [
    count === 1 ? "Спасибо, что купили билет." : "Спасибо, что купили билеты.",
    "",
    'Спектакль "Мир Дверь Мяч" (Peace Door Ball).',
    placesBlock,
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
  seats: SeatSelection[];
  posterCid: string;
  hasPoster: boolean;
}): string {
  const venueHtml = VENUE_BLOCK.split("\n")
    .map((line) => esc(line))
    .join("<br/>");
  const posterBlock = opts.hasPoster
    ? `<p style="margin:20px 0 0"><img src="cid:${opts.posterCid}" alt="Мир Дверь Мяч" width="560" style="max-width:100%;height:auto;border-radius:10px;display:block" /></p>`
    : "";
  const count = opts.seats.length;
  const placesHtml =
    count === 1
      ? `<p><strong>"Мир Дверь Мяч"</strong> (Peace Door Ball)<br/>
  Место: ряд <strong>${esc(opts.seats[0].row)}</strong>, номер <strong>${opts.seats[0].seat}</strong>.</p>`
      : `<p><strong>"Мир Дверь Мяч"</strong> (Peace Door Ball)<br/>
  Места:</p><ul style="margin:8px 0 0;padding-left:1.25rem">${opts.seats
    .map(
      (s) =>
        `<li>ряд <strong>${esc(s.row)}</strong>, номер <strong>${s.seat}</strong></li>`,
    )
    .join("")}</ul>`;

  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.55;color:#1a1814;background:#f4efe4;">
  <p>${count === 1 ? "Спасибо, что купили билет." : "Спасибо, что купили билеты."}</p>
  ${placesHtml}
  <p>Дата: <strong>22 июня 2026</strong>, время: <strong>20:00</strong></p>
  <p style="margin-top:12px">Адрес:<br/>${venueHtml}</p>
  ${posterBlock}
  <p style="margin-top:20px">До встречи!</p>
</body>
</html>`;
}
