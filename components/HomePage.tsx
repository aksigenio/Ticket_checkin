"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type { RowLetter } from "@/lib/seats";
import { ROWS } from "@/lib/seats";
import { formatPriceEUR, priceEur } from "@/lib/pricing";
import { BookingDialog } from "./BookingDialog";

function seatKey(row: RowLetter, seat: number) {
  return `${row}-${seat}`;
}

const FRONT_ROWS = new Set<RowLetter>(["A", "B", "C", "D", "E"]);

export function HomePage() {
  const [occupied, setOccupied] = useState<Set<string>>(new Set());
  const [loadingMap, setLoadingMap] = useState(true);
  const [selection, setSelection] = useState<{ row: RowLetter; seat: number } | null>(null);

  const refreshOccupied = useCallback(async () => {
    setLoadingMap(true);
    try {
      const res = await fetch("/api/seats", { cache: "no-store" });
      const data = await res.json();
      const keys: string[] = Array.isArray(data.keys) ? data.keys : [];
      setOccupied(new Set(keys));
    } catch {
      setOccupied(new Set());
    } finally {
      setLoadingMap(false);
    }
  }, []);

  useEffect(() => {
    void refreshOccupied();
  }, [refreshOccupied]);

  const dialogPrice = useMemo(() => {
    if (!selection) return 0;
    return priceEur(selection.row, selection.seat);
  }, [selection]);

  return (
    <main className="mx-auto max-w-6xl px-3 py-8 pb-16 sm:px-6 sm:py-10">
      <div className="paper-texture rounded-2xl border border-stone-300/80 p-4 shadow-2xl shadow-black/40 sm:p-10">
        <header className="border-b border-stone-300/80 pb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-red)]">
            Boutique da Cultura
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-stone-900 sm:text-4xl">
            Мир Дверь Мяч
          </h1>
          <p className="mt-1 text-lg text-stone-700">Peace Door Ball</p>
          <p className="mt-3 text-sm italic text-stone-600">Пьеса не про футбол</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm text-stone-700">
            <span className="rounded-full bg-white/70 px-3 py-1">22 июня 2026 · 20:00</span>
            <span className="rounded-full bg-white/70 px-3 py-1">Лиссабон</span>
          </div>
          <p className="mt-3 text-xs text-stone-500">
            Режиссёр-постановщик Алексей Худяков · Автор пьесы Егор Черлак
          </p>
        </header>

        <section className="mt-8 space-y-2">
          <div className="stage mx-auto max-w-2xl rounded-lg px-4 py-3 text-center sm:max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-300">Сцена</p>
          </div>

          <p className="px-1 pt-4 text-center text-sm text-stone-600">
            Выберите свободное место на схеме. На узком экране схему можно прокручивать вбок.
          </p>

          {loadingMap ? (
            <p className="py-8 text-center text-sm text-stone-500">Загрузка схемы…</p>
          ) : (
            <div className="relative -mx-1 mt-2 sm:mx-0">
              <div className="overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch]">
                <div className="inline-block min-w-full align-middle sm:min-w-0">
                  <div className="grid w-max max-w-none justify-items-start gap-y-1.5 pr-1 sm:w-full sm:max-w-full">
                    {ROWS.map((row) => {
                      const isFront = FRONT_ROWS.has(row.label);
                      const rowInner = (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="w-[3.25rem] shrink-0 text-right text-[10px] font-bold leading-tight text-stone-600 sm:w-20 sm:text-sm">
                            FILA {row.label}
                          </div>
                          <div className="flex flex-nowrap items-center gap-0.5 sm:gap-1.5">
                            {row.seats.map((n, idx) => (
                              <Fragment key={n}>
                                <SeatButton
                                  row={row.label}
                                  seat={n}
                                  occupied={occupied}
                                  onPick={() => setSelection({ row: row.label, seat: n })}
                                />
                                {row.aisleAfterIndex !== undefined && idx === row.aisleAfterIndex - 1 ? (
                                  <div
                                    className="mx-0.5 h-8 w-3.5 shrink-0 rounded-sm border border-dashed border-stone-400/80 bg-stone-200/40 sm:mx-1 sm:h-10 sm:w-5 md:mx-2 md:w-6"
                                    aria-hidden
                                    title="Проход"
                                  />
                                ) : null}
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      );

                      return (
                        <div
                          key={row.label}
                          className={
                            row.sectionBreakBefore
                              ? "justify-self-stretch mt-8 w-full max-w-full border-t-2 border-dashed border-stone-400/70 pt-6 sm:mt-10 sm:pt-8"
                              : isFront
                                ? "justify-self-start"
                                : "justify-self-center"
                          }
                        >
                          {row.sectionBreakBefore ? (
                            <div className="flex justify-center">{rowInner}</div>
                          ) : (
                            rowInner
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-10 grid gap-4 border-t border-stone-300/80 pt-8 text-sm text-stone-800">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">
              Адрес
            </h2>
            <p className="mt-1 leading-relaxed">
              Boutique da Cultura — Espaço Boutique da Cultura, Av. Colégio Militar, em frente Rua Adelaide
              Cabete, 1500-187 Lisboa, Portugal
            </p>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">
              Цены
            </h2>
            <ul className="mt-1 list-inside list-disc space-y-1 text-stone-700">
              <li>Ряд A — все места 15€</li>
              <li>Ряды B, C, D, E — места 1, 2, 12 и 13 по 10€; остальные по 15€</li>
              <li>Последние три ряда (F, G, H) — все места по 10€</li>
            </ul>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-stone-500">
          <a className="underline decoration-stone-400 underline-offset-2" href="/admin">
            Вход для администратора
          </a>
        </p>
      </div>

      {selection ? (
        <BookingDialog
          row={selection.row}
          seat={selection.seat}
          priceLabel={formatPriceEUR(dialogPrice)}
          onClose={() => setSelection(null)}
          onBooked={() => {
            setSelection(null);
            void refreshOccupied();
          }}
        />
      ) : null}
    </main>
  );
}

function SeatButton({
  row,
  seat,
  occupied,
  onPick,
}: {
  row: RowLetter;
  seat: number;
  occupied: Set<string>;
  onPick: () => void;
}) {
  const key = seatKey(row, seat);
  const busy = occupied.has(key);
  const price = priceEur(row, seat);
  const base =
    "shrink-0 flex items-center justify-center rounded-md border font-semibold text-stone-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-red)] focus-visible:ring-offset-1 " +
    "h-8 min-h-8 min-w-[1.85rem] max-w-[1.85rem] text-[11px] sm:h-10 sm:min-h-10 sm:min-w-10 sm:max-w-none sm:text-sm";

  return (
    <button
      type="button"
      disabled={busy}
      title={busy ? "Занято" : `${formatPriceEUR(price)} · FILA ${row}, место ${seat}`}
      onClick={() => {
        if (!busy) onPick();
      }}
      className={
        busy
          ? `${base} cursor-not-allowed border-stone-400 bg-stone-400/90 text-stone-700 opacity-80`
          : `${base} border-stone-500 bg-white shadow-sm hover:border-stone-800 hover:bg-amber-50`
      }
    >
      {seat}
    </button>
  );
}
