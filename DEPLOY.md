# Деплой на Vercel (ticket-checkin)

## Ошибка сборки: `Can't resolve '@/lib/booking-seats'`

Загрузите **весь проект**, а не отдельные файлы. Обязательно должны быть обновлены:

- `lib/seats.ts` (логика нескольких мест)
- `components/HomePage.tsx`
- `components/BookingDialog.tsx`
- `app/api/book/route.ts`
- `app/api/admin/issue/route.ts`
- `app/api/admin/bookings/route.ts`
- `app/admin/page.tsx`
- `lib/email.ts`

Файла `lib/booking-seats.ts` больше нет — его код в `lib/seats.ts`.

После загрузки в GitHub: Vercel → **Redeploy** (или новый commit).

## Ошибка при покупке: `order_id`

Актуальная версия **не использует** колонку `order_id`. Несколько мест объединяются по общему пути к чеку (`receipt_path`).

Если на сайте всё ещё видите текст про `order_id` — на Vercel задеплоена **старая** сборка. Сделайте redeploy с файлами выше.

## Supabase

Достаточно исходной схемы `supabase/schema.sql`. Дополнительные миграции для нескольких мест **не нужны**.
