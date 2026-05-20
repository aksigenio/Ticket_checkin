"use client";

import { useState } from "react";
import type { RowLetter } from "@/lib/seats";

const IBAN_LINE = "Aleksei Khudiakov - NL62 BUNQ 2076 1197 28";
const REVOLUT_LINE = "@a_khudiakov";

export function BookingDialog({
  row,
  seat,
  priceLabel,
  onClose,
  onBooked,
}: {
  row: RowLetter;
  seat: number;
  priceLabel: string;
  onClose: () => void;
  onBooked: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Заполните имя, фамилию и email.");
      return;
    }
    if (!file) {
      setError("Прикрепите чек об оплате.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("firstName", firstName.trim());
      fd.set("lastName", lastName.trim());
      fd.set("email", email.trim());
      fd.set("row", row);
      fd.set("seat", String(seat));
      fd.set("receipt", file);
      const res = await fetch("/api/book", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Не удалось отправить заявку.");
        return;
      }
      setDone(true);
      onBooked();
    } catch {
      setError("Сетевая ошибка. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="paper-texture max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-stone-300 p-5 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-stone-900">
              Оформление места
            </h2>
            <p className="mt-1 text-sm text-stone-700">
              FILA <span className="font-semibold">{row}</span>, место{" "}
              <span className="font-semibold">{seat}</span>
              {" "}
              (<span className="font-semibold text-[var(--accent-green)]">{priceLabel}</span>)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-400 px-2 py-1 text-sm text-stone-600 hover:bg-stone-200/60"
          >
            Закрыть
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-stone-300 bg-white/80 p-4 text-sm text-stone-800">
          <p className="font-semibold text-stone-900">Оплата переводом</p>
          <p className="mt-2 leading-relaxed">
            Переведите <strong>{priceLabel}</strong> (ровно сумму билета) на IBAN или через Revolut:
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-stone-600">IBAN</p>
          <p className="mt-1 rounded-md bg-stone-100 px-3 py-2 font-mono text-[13px] leading-relaxed">
            {IBAN_LINE}
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-600">Revolut</p>
          <p className="mt-1 rounded-md bg-stone-100 px-3 py-2 font-mono text-[13px] leading-relaxed">
            {REVOLUT_LINE}
          </p>
          <p className="mt-2 text-xs text-stone-600">
            В комментарии к платежу напишите: билет {row}
            {seat} и ваш email.
          </p>
        </div>

        {done ? (
          <div className="mt-6 rounded-lg border border-[var(--accent-green)]/40 bg-emerald-50/80 p-4 text-sm text-emerald-950">
            <p className="font-semibold">Заявка отправлена</p>
            <p className="mt-2 leading-relaxed">
              Когда оплату проверят, на почту придет билет с рядом и номером места. Обычно это до суток.
            </p>
            <button
              type="button"
              className="mt-4 rounded-md bg-[var(--accent-green)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              onClick={onClose}
            >
              Понятно
            </button>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-stone-800">Имя</span>
                <input
                  required
                  className="mt-1 w-full rounded-md border border-stone-400 bg-white px-3 py-2 text-stone-900 outline-none ring-0 focus:border-stone-700"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-stone-800">Фамилия</span>
                <input
                  required
                  className="mt-1 w-full rounded-md border border-stone-400 bg-white px-3 py-2 text-stone-900 outline-none focus:border-stone-700"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="font-medium text-stone-800">Email</span>
              <input
                required
                type="email"
                className="mt-1 w-full rounded-md border border-stone-400 bg-white px-3 py-2 text-stone-900 outline-none focus:border-stone-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-stone-800">Чек об оплате (файл)</span>
              <input
                required
                type="file"
                accept="image/*,.pdf"
                className="mt-1 w-full text-sm text-stone-700 file:mr-3 file:rounded-md file:border file:border-stone-400 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-800"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-[var(--accent-red)] py-2.5 text-sm font-semibold text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Отправка..." : "Отправить заявку"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
