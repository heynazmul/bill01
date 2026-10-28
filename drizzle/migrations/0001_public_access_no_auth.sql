-- Replace per-user policies with public access (app no longer has login)
drop policy if exists "own bills select" on public.bills;
drop policy if exists "own bills insert" on public.bills;
drop policy if exists "own bills update" on public.bills;
drop policy if exists "own bills delete" on public.bills;
drop policy if exists "own settings select" on public.house_settings;
drop policy if exists "own settings insert" on public.house_settings;
drop policy if exists "own settings update" on public.house_settings;

create policy "public bills select" on public.bills for select to anon, authenticated using (true);
create policy "public bills insert" on public.bills for insert to anon, authenticated with check (true);
create policy "public bills update" on public.bills for update to anon, authenticated using (true) with check (true);
create policy "public bills delete" on public.bills for delete to anon, authenticated using (true);
create policy "public settings select" on public.house_settings for select to anon, authenticated using (true);
create policy "public settings insert" on public.house_settings for insert to anon, authenticated with check (true);
create policy "public settings update" on public.house_settings for update to anon, authenticated using (true) with check (true);

grant select, insert, update, delete on public.bills to anon;
grant select, insert, update on public.house_settings to anon;

comment on column public.bills.user_id is 'DEPRECATED: login removed; app writes a fixed singleton id so the one-bill-per-month constraint still works';
comment on column public.house_settings.user_id is 'DEPRECATED: login removed; app writes a fixed singleton id for the single shared settings row';