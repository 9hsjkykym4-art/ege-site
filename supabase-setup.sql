-- Выполните в Supabase: SQL Editor -> New query -> Run
create table public.leaderboard (
  user_id uuid primary key default auth.uid(),
  nick text not null check (char_length(nick) between 1 and 20),
  score int not null check (score between 0 and 848), -- 748 карточек сейчас; при росте списка увеличьте
  updated_at timestamptz not null default now()
);
alter table public.leaderboard enable row level security;
create policy "read all" on public.leaderboard for select using (true);
create policy "insert own" on public.leaderboard for insert to authenticated with check (auth.uid() = user_id);
create policy "update own" on public.leaderboard for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own" on public.leaderboard for delete to authenticated using (auth.uid() = user_id);

-- Права доступа для Data API (нужны, если отключено «Автоматически отображать новые таблицы»)
grant usage on schema public to anon, authenticated;
grant select on public.leaderboard to anon, authenticated;
grant insert, update, delete on public.leaderboard to authenticated;
