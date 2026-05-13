"use client";

import { useCallback, useState } from "react";

type Booking = {
  id: string;
  created_at: string;
  row_letter: string;
  seat_number: number;
  price_eur: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [issuing, setIssuing] = useState<string | null>(null);

  const load = useCallback(async (pwd: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bookings", {
        headers: { Authorization: `Bearer ${pwd}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Ошибка загрузки.");
        return;
      }
      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      setToken(pwd);
    } catch {
      setError("Сетевая ошибка.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function issueTicket(id: string) {
    if (!token) return;
    setIssuing(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/issue", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Не удалось отправить билет.");
        return;
      }
      await load(token);
    } catch {
      setError("Сетевая ошибка при отправке билета.");
    } finally {
      setIssuing(null);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 text-stone-100">
      <h1 className="text-2xl font-semibold">Админка — заявки на билеты</h1>
      <p className="mt-2 text-sm text-stone-400">
        Введите пароль из переменной окружения <code className="text-stone-200">ADMIN_PASSWORD</code>. После
        проверки оплаты нажмите «Отправить билет» — письмо уйдёт на email покупателя.
      </p>

      {!token ? (
        <form
          className="mt-8 flex max-w-md flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void load(password);
          }}
        >
          <label className="text-sm">
            <span className="text-stone-300">Пароль</span>
            <input
              type="password"
              className="mt-1 w-full rounded-md border border-stone-600 bg-stone-900 px-3 py-2 text-stone-100 outline-none focus:border-stone-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <button
            type="submit"
            disabled={loading || !password}
            className="rounded-md bg-stone-200 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-white disabled:opacity-50"
          >
            {loading ? "Вход…" : "Войти"}
          </button>
        </form>
      ) : null}

      {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}

      {token ? (
        <div className="mt-10 overflow-x-auto rounded-lg border border-stone-700">
          <table className="min-w-full divide-y divide-stone-700 text-left text-sm">
            <thead className="bg-stone-900/80">
              <tr>
                <th className="px-3 py-2 font-medium text-stone-300">Дата</th>
                <th className="px-3 py-2 font-medium text-stone-300">Место</th>
                <th className="px-3 py-2 font-medium text-stone-300">Цена</th>
                <th className="px-3 py-2 font-medium text-stone-300">Имя</th>
                <th className="px-3 py-2 font-medium text-stone-300">Email</th>
                <th className="px-3 py-2 font-medium text-stone-300">Статус</th>
                <th className="px-3 py-2 font-medium text-stone-300" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 bg-stone-950/40">
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-stone-400">
                    {new Date(b.created_at).toLocaleString("ru-RU")}
                  </td>
                  <td className="px-3 py-2 font-mono text-stone-100">
                    {b.row_letter}
                    {b.seat_number}
                  </td>
                  <td className="px-3 py-2">{b.price_eur}€</td>
                  <td className="px-3 py-2">
                    {b.first_name} {b.last_name}
                  </td>
                  <td className="break-all px-3 py-2 text-stone-300">{b.email}</td>
                  <td className="px-3 py-2 text-stone-400">{b.status}</td>
                  <td className="px-3 py-2">
                    {b.status === "pending" ? (
                      <button
                        type="button"
                        disabled={issuing === b.id}
                        className="rounded bg-emerald-700 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                        onClick={() => void issueTicket(b.id)}
                      >
                        {issuing === b.id ? "…" : "Отправить билет"}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 ? <p className="p-4 text-stone-500">Пока нет заявок.</p> : null}
        </div>
      ) : null}

      {token ? (
        <button
          type="button"
          className="mt-8 text-sm text-stone-500 underline"
          onClick={() => {
            setToken(null);
            setBookings([]);
            setPassword("");
          }}
        >
          Выйти
        </button>
      ) : null}
    </main>
  );
}
