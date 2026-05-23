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
