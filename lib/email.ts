const VENUE_BLOCK = `Boutique da Cultura
Espaço Boutique da Cultura, Av. Colégio Militar, em frente Rua Adelaide Cabete, 1500-187 Lisboa, Portugal`;

export function adminNewBookingEmail(opts: {
  bookingId: string;
  row: string;
  seat: number;
  priceEur: number;
  firstName: string;
  lastName: string;
  email: string;
}) {
  const subject = `Новая заявка на билет · FILA ${opts.row} · место ${opts.seat}`;
  const text = [
    `ID заявки: ${opts.bookingId}`,
    `Место: FILA ${opts.row}, место ${opts.seat}`,
    `Цена: ${opts.priceEur}€`,
    `Имя: ${opts.firstName}`,
    `Фамилия: ${opts.lastName}`,
    `Email покупателя: ${opts.email}`,
    "",
    "Проверьте поступление оплаты на IBAN, затем нажмите «Отправить билет» в админке.",
  ].join("\n");
  return { subject, text };
}

export function customerTicketEmail(opts: { row: string; seat: number }) {
  const subject = `Ваш билет · «Мир Дверь Мяч» · FILA ${opts.row} · ${opts.seat}`;
  const text = [
    "Спасибо за приобретение билета!",
    "",
    "Спектакль «Мир Дверь Мяч» (Peace Door Ball)",
    `Ваше место: ряд ${opts.row}, место ${opts.seat}.`,
    "",
    "Дата: 22 июня 2026, время: 20:00",
    "",
    "Адрес:",
    VENUE_BLOCK,
    "",
    "До встречи в зале!",
  ].join("\n");
  return { subject, text };
}
