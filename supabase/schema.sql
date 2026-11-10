-- ============================================================================
-- ФАЙЛ: supabase/schema.sql — Список администраторов сайта в базе Supabase
-- ЗА ЧТО ОТВЕЧАЕТ: Создаёт таблицу admins с почтами тех, кому разрешён вход
--   в панель «Администрирование» (#/admin), и защищает её политиками RLS,
--   чтобы ни один посетитель сайта не мог прочитать этот список.
-- ОТКУДА БЕРЁТ ИНФОРМАЦИЮ: Выполняется вами один раз в панели Supabase
--   (раздел SQL Editor → New query → вставить текст → Run).
-- КАК ИЗМЕНИТЬ:
--   — Чтобы разрешить доступ другому человеку, добавьте строку с его почтой
--     (внизу файла есть готовый шаблон INSERT).
--   — Почта в таблице admins должна совпадать с почтой аккаунта,
--     созданного в Supabase → Authentication → Users → Add user.
-- ==========================================================================

-- 1. Таблица со списком администраторов
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'owner',
  created_at timestamptz not null default now()
);

comment on table public.admins is 'Почты владельцев сайта, которым разрешён вход в панель «Администрирование»';

-- 2. Защита таблицы: без неё список мог бы прочитать любой
alter table public.admins enable row level security;

-- 3. Каждый вошедший пользователь видит только свою строку
drop policy if exists "admins_select_own" on public.admins;
create policy "admins_select_own"
  on public.admins
  for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- 4. Ваш аккаунт: замените почту на свою и запустите запрос
insert into public.admins (email, role)
values ('zingerkapyt@rambler.ru', 'owner')
on conflict (email) do update set role = excluded.role;

-- 5. Чтобы дать доступ второму человеку — раскомментируйте и впишите его почту
-- insert into public.admins (email, role)
-- values ('assistant@example.com', 'admin')
-- on conflict (email) do update set role = excluded.role;
