"use client";

import { useCallback, useMemo, useState } from "react";

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
  order_id: string | null;
};

type AdminRow = {
  key: string;
  issueBookingId: string;
  created_at: string;
  seatsLabel: string;
  totalEur: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  seatCount: number;
  isGrouped: boolean;
};

function buildAdminRows(bookings: Booking[]): AdminRow[] {
  const rows: AdminRow[] = [];
  const seenOrders = new Set<string>();

  for (const b of bookings) {
    if (b.order_id && b.status === "pending") {
      if (seenOrders.has(b.order_id)) continue;
      seenOrders.add(b.order_id);
      const group = bookings.filter((x) => x.order_id === b.order_id && x.status === "pending");
      rows.push({
        key: `order-${b.order_id}`,
        issueBookingId: group[0].id,
        created_at: b.created_at,
        seatsLabel: group.map((g) => `${g.row_letter}${g.seat_number}`).join(", "),
        totalEur: group.reduce((s, g) => s + g.price_eur, 0),
        first_name: b.first_name,
        last_name: b.last_name,
        email: b.email,
        status: b.status,
        seatCount: group.length,
        isGrouped: group.length > 1,
      });
      continue;
    }

    if (b.order_id && b.status !== "pending") {
      const group = bookings.filter((x) => x.order_id === b.order_id);
      const lead = group[0];
      if (lead.id !== b.id) continue;
      rows.push({
        key: `order-done-${b.order_id}`,
        issueBookingId: b.id,
        created_at: b.created_at,
        seatsLabel: group.map((g) => `${g.row_letter}${g.seat_number}`).join(", "),
        totalEur: group.reduce((s, g) => s + g.price_eur, 0),
        first_name: b.first_name,
        last_name: b.last_name,
        email: b.email,
        status: b.status,
        seatCount: group.length,
        isGrouped: group.length > 1,
      });
      continue;
    }

    if (!b.order_id) {
      rows.push({
        key: b.id,
        issueBookingId: b.id,
        created_at: b.created_at,
        seatsLabel: `${b.row_letter}${b.seat_number}`,
        totalEur: b.price_eur,
        first_name: b.first_name,
        last_name: b.last_name,
        email: b.email,
        status: b.status,
        seatCount: 1,
        isGrouped: false,
      });
    }
  }

  return rows;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [issuing, setIssuing] = useState<string | null>(null);

  const adminRows = useMemo(() => buildAdminRows(bookings), [bookings]);

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
      <h1 className="text-2xl font-semibold">Заявки на билеты</h1>
      <p className="mt-2 text-sm text-stone-400">
        Пароль из переменной <code className="text-stone-200">ADMIN_PASSWORD</code>. После проверки оплаты
        нажмите «Отправить» — покупателю уйдёт одно письмо со всеми местами заказа.
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
            {loading ? "Вход..." : "Войти"}
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
                <th className="px-3 py-2 font-medium text-stone-300">Места</th>
                <th className="px-3 py-2 font-medium text-stone-300">Сумма</th>
                <th className="px-3 py-2 font-medium text-stone-300">Имя</th>
                <th className="px-3 py-2 font-medium text-stone-300">Email</th>
                <th className="px-3 py-2 font-medium text-stone-300">Статус</th>
                <th className="px-3 py-2 font-medium text-stone-300" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 bg-stone-950/40">
              {adminRows.map((b) => (
                <tr key={b.key}>
                  <td className="whitespace-nowrap px-3 py-2 text-stone-400">
                    {new Date(b.created_at).toLocaleString("ru-RU")}
                  </td>
                  <td className="px-3 py-2 font-mono text-stone-100">
                    {b.seatsLabel}
                    {b.isGrouped ? (
                      <span className="ml-1 text-xs text-stone-500">({b.seatCount})</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">{b.totalEur}€</td>
                  <td className="px-3 py-2">
                    {b.first_name} {b.last_name}
                  </td>
                  <td className="break-all px-3 py-2 text-stone-300">{b.email}</td>
                  <td className="px-3 py-2 text-stone-400">{b.status}</td>
                  <td className="px-3 py-2">
                    {b.status === "pending" ? (
                      <button
                        type="button"
                        disabled={issuing === b.issueBookingId}
                        className="rounded bg-emerald-700 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                        onClick={() => void issueTicket(b.issueBookingId)}
                      >
                        {issuing === b.issueBookingId
                          ? "..."
                          : b.seatCount > 1
                            ? `Отправить (${b.seatCount})`
                            : "Отправить билет"}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {adminRows.length === 0 ? <p className="p-4 text-stone-500">Пока нет заявок.</p> : null}
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
