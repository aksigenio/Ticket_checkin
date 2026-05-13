import type { RowLetter } from "./seats";

const EDGE_SEATS = new Set([1, 2, 12, 13]);

export function priceEur(row: RowLetter, seatNumber: number): number {
  if (row === "A") return 15;
  if (row === "B" || row === "C" || row === "D" || row === "E") {
    return EDGE_SEATS.has(seatNumber) ? 10 : 15;
  }
  if (row === "F" || row === "G" || row === "H") return 10;
  return 10;
}

export function formatPriceEUR(amount: number): string {
  return `${amount}€`;
}
