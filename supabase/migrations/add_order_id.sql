-- Для уже существующей базы: Supabase → SQL Editor → выполнить один раз.

alter table public.bookings add column if not exists order_id uuid;

create index if not exists bookings_order_id_idx on public.bookings (order_id) where order_id is not null;
