export type RowLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

/** After which seat index (0-based) to insert central aisle gap */
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
 * Layout matches the hall diagram:
 * A: 6 seats centered (we center via CSS)
 * B–E: 13 seats
 * Aisle between E and F
 * F,G: 8 seats with vertical aisle after seats 1–3 (left block), then 4–8
 * H: 12 seats with aisle after seats 1–4, then 5–12
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
    aisleAfterIndex: 3,
    sectionBreakBefore: true,
  },
  { label: "G", seats: [1, 2, 3, 4, 5, 6, 7, 8], aisleAfterIndex: 3 },
  { label: "H", seats: Array.from({ length: 12 }, (_, i) => i + 1), aisleAfterIndex: 4 },
];

export function seatLabel(row: RowLetter, seat: number): string {
  return `FILA ${row} · ${seat}`;
}
