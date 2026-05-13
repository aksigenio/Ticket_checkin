-- Запустите в Supabase → SQL Editor

create type public.booking_status as enum ('pending', 'issued', 'cancelled');

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  row_letter text not null check (row_letter in ('A','B','C','D','E','F','G','H')),
  seat_number int not null,
  price_eur int not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  receipt_path text,
  status public.booking_status not null default 'pending'
);

create unique index if not exists bookings_unique_active_seat
  on public.bookings (row_letter, seat_number)
  where status in ('pending', 'issued');

alter table public.bookings enable row level security;

-- Политики для anon/auth не нужны: API использует service role и обходит RLS.

comment on table public.bookings is 'Заявки на билеты «Мир Дверь Мяч»';
