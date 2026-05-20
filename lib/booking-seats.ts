import { priceEur } from "@/lib/pricing";
import type { RowLetter } from "@/lib/seats";
import { ROWS } from "@/lib/seats";

const ROW_SET = new Set<RowLetter>(["A", "B", "C", "D", "E", "F", "G", "H"]);

export type SeatSelection = { row: RowLetter; seat: number };

export function seatKey(row: RowLetter, seat: number): string {
  return `${row}-${seat}`;
}

function validSeat(row: RowLetter, seat: number): boolean {
  const meta = ROWS.find((r) => r.label === row);
  return !!meta && meta.seats.includes(seat);
}

export function parseSeatsJson(raw: string): SeatSelection[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 12) {
    return null;
  }

  const out: SeatSelection[] = [];
  const seen = new Set<string>();

  for (const item of parsed) {
    if (!item || typeof item !== "object") return null;
    const row = String((item as { row?: unknown }).row ?? "")
      .trim()
      .toUpperCase() as RowLetter;
    const seat = Number((item as { seat?: unknown }).seat);
    if (!ROW_SET.has(row) || !Number.isInteger(seat) || !validSeat(row, seat)) {
      return null;
    }
    const key = seatKey(row, seat);
    if (seen.has(key)) return null;
    seen.add(key);
    out.push({ row, seat });
  }

  return out;
}

export function totalPriceEur(seats: SeatSelection[]): number {
  return seats.reduce((sum, s) => sum + priceEur(s.row, s.seat), 0);
}

export function formatSeatList(seats: SeatSelection[]): string {
  return seats.map((s) => `FILA ${s.row}, место ${s.seat}`).join("; ");
}

export function formatPaymentComment(seats: SeatSelection[], email: string): string {
  const parts = seats.map((s) => `${s.row}${s.seat}`);
  return `билеты ${parts.join(", ")} и ${email}`;
}
