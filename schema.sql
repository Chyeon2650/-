begin;

create extension if not exists pgcrypto;

create table if not exists public.memos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  content text not null check (char_length(content) between 1 and 2000),
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.memos enable row level security;

grant usage on schema public to anon, authenticated, service_role;
revoke all on table public.memos from public, anon, authenticated;
revoke all (id, title, content, password_hash, created_at)
on table public.memos from public, anon, authenticated;
-- Public clients can read only these columns. Hashes stay on the server.
grant select (id, title, content, created_at)
on table public.memos to anon, authenticated;
grant select, insert, delete on table public.memos to service_role;

drop policy if exists "Anyone can read memos" on public.memos;
create policy "Anyone can read memos"
on public.memos
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can create memos" on public.memos;
-- Creation and deletion go through server APIs with validation.

create index if not exists memos_created_at_idx
on public.memos (created_at desc);

commit;
