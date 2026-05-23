import { priceEur } from "@/lib/pricing";

export type RowLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

/** After which seat index (0-based) to insert central aisle gap (unused for current hall) */
export type RowMeta = {
  label: RowLetter;
  /** Seat numbers in order left-to-right */
  seats: number[];
  /** Insert visual gap after this many seats from the left (not after seat number) */
  aisleAfterIndex?: number;
  /** Wider gap before this row (horizontal aisle after row E) */
  sectionBreakBefore?: boolean;
};

/**
 * F, G, H - сплошной ряд на схеме.
 * Aisle between E and F kept via sectionBreakBefore on F.
 */
export const ROWS: RowMeta[] = [
  { label: "A", seats: [1, 2, 3, 4, 5, 6] },
  { label: "B", seats: Array.from({ length: 13 }, (_, i) => i + 1) },
  { label: "C", seats: Array.from({ length: 13 }, (_, i) => i + 1) },
  { label: "D", seats: Array.from({ length: 13 }, (_, i) => i + 1) },
  { label: "E", seats: Array.from({ length: 13 }, (_, i) => i + 1) },
  {
    label: "F",
    seats: [1, 2, 3, 4, 5, 6, 7, 8],
    sectionBreakBefore: true,
  },
  { label: "G", seats: [1, 2, 3, 4, 5, 6, 7, 8] },
  { label: "H", seats: Array.from({ length: 12 }, (_, i) => i + 1) },
];

export function seatLabel(row: RowLetter, seat: number): string {
  return `FILA ${row} - ${seat}`;
}

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
