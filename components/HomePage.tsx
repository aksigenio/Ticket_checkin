"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { seatKey, totalPriceEur, type SeatSelection } from "@/lib/booking-seats";
import type { RowLetter } from "@/lib/seats";
import { ROWS } from "@/lib/seats";
import { formatPriceEUR } from "@/lib/pricing";
import { BookingDialog } from "./BookingDialog";

const FRONT_ROWS = new Set<RowLetter>(["A", "B", "C", "D", "E"]);

export function HomePage() {
  const [occupied, setOccupied] = useState<Set<string>>(new Set());
  const [loadingMap, setLoadingMap] = useState(true);
  const [cart, setCart] = useState<SeatSelection[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

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

  const cartKeys = useMemo(() => new Set(cart.map((s) => seatKey(s.row, s.seat))), [cart]);

  const cartTotal = useMemo(() => totalPriceEur(cart), [cart]);

  function toggleSeat(row: RowLetter, seat: number) {
    const key = seatKey(row, seat);
    if (occupied.has(key)) return;

    setCart((prev) => {
      const exists = prev.some((s) => s.row === row && s.seat === seat);
      if (exists) {
        return prev.filter((s) => !(s.row === row && s.seat === seat));
      }
      return [...prev, { row, seat }].sort(
        (a, b) => a.row.localeCompare(b.row) || a.seat - b.seat,
      );
    });
  }

  function clearCart() {
    setCart([]);
    setCheckoutOpen(false);
  }

  return (
    <main className="mx-auto max-w-6xl px-3 py-8 pb-28 sm:px-6 sm:py-10 sm:pb-32">
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
            <span className="rounded-full bg-white/70 px-3 py-1">22 июня 2026, 20:00</span>
            <span className="rounded-full bg-white/70 px-3 py-1">Лиссабон</span>
          </div>
          <p className="mt-3 text-xs text-stone-500">
            Режиссёр-постановщик Алексей Худяков, автор пьесы Егор Черлак
          </p>
        </header>

        <section className="mt-8 space-y-2">
          <div className="stage mx-auto max-w-2xl rounded-lg px-4 py-3 text-center sm:max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-300">Сцена</p>
          </div>

          <p className="px-1 pt-4 text-center text-sm text-stone-600">
            Нажимайте свободные места, чтобы добавить их в заказ. Повторный клик убирает место из заказа.
            На телефоне схему можно сдвинуть пальцем в сторону.
          </p>
          <p className="mx-auto mt-3 max-w-xl rounded-lg border border-stone-300/90 bg-amber-50/90 px-3 py-2.5 text-center text-sm text-stone-800">
            После проверки оплаты на email придёт одно письмо со всеми выбранными местами. Обычно до суток.
          </p>

          {loadingMap ? (
            <p className="py-8 text-center text-sm text-stone-500">Загрузка...</p>
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
                                  selected={cartKeys}
                                  onToggle={() => toggleSeat(row.label, n)}
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
              Boutique da Cultura - Espaço Boutique da Cultura, Av. Colégio Militar, em frente Rua Adelaide Cabete,
              1500-187 Lisboa, Portugal
            </p>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">
              Цены
            </h2>
            <ul className="mt-1 list-inside list-disc space-y-1 text-stone-700">
              <li>Ряд A: все по 15€</li>
              <li>Ряды B, C, D, E: места 1, 2, 12 и 13 по 10€, остальные по 15€</li>
              <li>Ряды F, G, H: все по 10€</li>
            </ul>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-stone-500">
          <a className="underline decoration-stone-400 underline-offset-2" href="/admin">
            Вход для администратора
          </a>
        </p>
      </div>

      {cart.length > 0 && !checkoutOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-300 bg-[#f4efe4]/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-sm text-stone-800">
              <p className="font-semibold text-stone-900">
                Выбрано мест: {cart.length} · {formatPriceEUR(cartTotal)}
              </p>
              <p className="mt-0.5 truncate text-stone-600">
                {cart.map((s) => `${s.row}${s.seat}`).join(", ")}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                className="rounded-md border border-stone-400 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-200/60"
                onClick={clearCart}
              >
                Очистить
              </button>
              <button
                type="button"
                className="rounded-md bg-[var(--accent-red)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                onClick={() => setCheckoutOpen(true)}
              >
                Оформить
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {checkoutOpen && cart.length > 0 ? (
        <BookingDialog
          seats={cart}
          totalLabel={formatPriceEUR(cartTotal)}
          onClose={() => setCheckoutOpen(false)}
          onBooked={() => {
            clearCart();
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
  selected,
  onToggle,
}: {
  row: RowLetter;
  seat: number;
  occupied: Set<string>;
  selected: Set<string>;
  onToggle: () => void;
}) {
  const key = seatKey(row, seat);
  const busy = occupied.has(key);
  const picked = selected.has(key);
  const base =
    "shrink-0 flex items-center justify-center rounded-md border font-semibold text-stone-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-red)] focus-visible:ring-offset-1 " +
    "h-8 min-h-8 min-w-[1.85rem] max-w-[1.85rem] text-[11px] sm:h-10 sm:min-h-10 sm:min-w-10 sm:max-w-none sm:text-sm";

  return (
    <button
      type="button"
      disabled={busy}
      title={
        busy
          ? "Занято"
          : picked
            ? `Убрать из заказа, FILA ${row}, место ${seat}`
            : `Добавить в заказ, FILA ${row}, место ${seat}`
      }
      onClick={() => {
        if (!busy) onToggle();
      }}
      className={
        busy
          ? `${base} cursor-not-allowed border-stone-400 bg-stone-400/90 text-stone-700 opacity-80`
          : picked
            ? `${base} border-[var(--accent-green)] bg-emerald-100 shadow-sm ring-1 ring-[var(--accent-green)]/50`
            : `${base} border-stone-500 bg-white shadow-sm hover:border-stone-800 hover:bg-amber-50`
      }
    >
      {seat}
    </button>
  );
}
