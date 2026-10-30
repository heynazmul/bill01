-- Account approval for the Monthly House Bill Tracker.
--
-- Public visitors keep read-only access to bills and house settings.
-- Signed-in users whose profile status is "approved" may add/edit bills,
-- record payments and change settings.
-- The owner approves new accounts from the dashboard.
--
-- Run this file once in the Supabase SQL editor (or with the Supabase CLI)
-- before using the login/approval screens.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  display_name text,
  role text not null default 'member' check (role in ('owner', 'member')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null
);

alter table public.profiles enable row level security;

grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- Security-definer helpers avoid recursive profile RLS checks.
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'owner'
      and status = 'approved'
  );
$$;

create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'approved'
  );
$$;

revoke all on function public.is_owner() from public;
revoke all on function public.is_approved() from public;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.is_approved() to authenticated;

-- Create a profile for every new auth user.
-- The first account becomes the owner automatically; later accounts wait for approval.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  first_user boolean;
begin
  select not exists (select 1 from public.profiles) into first_user;

  insert into public.profiles (id, email, display_name, role, status, approved_at, approved_by)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    case when first_user then 'owner' else 'member' end,
    case when first_user then 'approved' else 'pending' end,
    case when first_user then now() else null end,
    case when first_user then new.id else null end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- If the project already has auth users, create their profiles too. If no owner
-- exists, promote the oldest account so the existing deployment is not locked out.
do $$
declare
  first_id uuid;
begin
  insert into public.profiles (id, email, created_at)
  select id, coalesce(email, ''), created_at
  from auth.users
  on conflict (id) do nothing;

  if not exists (select 1 from public.profiles where role = 'owner') then
    select id into first_id
    from public.profiles
    order by created_at asc, id asc
    limit 1;

    if first_id is not null then
      update public.profiles
      set role = 'owner',
          status = 'approved',
          approved_at = now(),
          approved_by = first_id,
          updated_at = now()
      where id = first_id;
    end if;
  end if;
end;
$$;

-- Keep the profile email in sync when the auth email changes.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = coalesce(new.email, ''),
      updated_at = now()
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
after update of email on auth.users
for each row execute function public.handle_user_email_change();

-- Owner-only approve/reject action, callable from the dashboard.
create or replace function public.review_account(target_id uuid, decision text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.profiles;
begin
  if not public.is_owner() then
    raise exception 'Only the owner can review account requests';
  end if;

  if decision not in ('approved', 'rejected', 'pending') then
    raise exception 'Invalid account decision';
  end if;

  update public.profiles
  set status = decision,
      approved_at = case when decision = 'approved' then now() else null end,
      approved_by = case when decision = 'approved' then auth.uid() else null end,
      updated_at = now()
  where id = target_id
    and role <> 'owner'
  returning * into updated;

  if updated is null then
    raise exception 'Account not found or cannot be changed';
  end if;

  return updated;
end;
$$;

revoke all on function public.review_account(uuid, text) from public;
grant execute on function public.review_account(uuid, text) to authenticated;

-- Profiles are visible to their owner and to the house owner. There are no
-- direct insert/update/delete policies: the trigger and review_account RPC are
-- the only write paths.
drop policy if exists "profiles select own or owner" on public.profiles;
create policy "profiles select own or owner"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_owner());

-- Bills: public read stays, writes require an approved account.
drop policy if exists "own bills select" on public.bills;
drop policy if exists "own bills insert" on public.bills;
drop policy if exists "own bills update" on public.bills;
drop policy if exists "own bills delete" on public.bills;
drop policy if exists "public bills select" on public.bills;
drop policy if exists "public bills insert" on public.bills;
drop policy if exists "public bills update" on public.bills;
drop policy if exists "public bills delete" on public.bills;
drop policy if exists "approved bills insert" on public.bills;
drop policy if exists "approved bills update" on public.bills;
drop policy if exists "approved bills delete" on public.bills;

grant select on public.bills to anon, authenticated;
revoke insert, update, delete on public.bills from anon;

create policy "public bills select"
on public.bills
for select
to anon, authenticated
using (true);

create policy "approved bills insert"
on public.bills
for insert
to authenticated
with check (public.is_approved());

create policy "approved bills update"
on public.bills
for update
to authenticated
using (public.is_approved())
with check (public.is_approved());

create policy "approved bills delete"
on public.bills
for delete
to authenticated
using (public.is_approved());

-- Settings: public read stays, writes require the house owner.
drop policy if exists "own settings select" on public.house_settings;
drop policy if exists "own settings insert" on public.house_settings;
drop policy if exists "own settings update" on public.house_settings;
drop policy if exists "public settings select" on public.house_settings;
drop policy if exists "public settings insert" on public.house_settings;
drop policy if exists "public settings update" on public.house_settings;
drop policy if exists "approved settings insert" on public.house_settings;
drop policy if exists "approved settings update" on public.house_settings;
drop policy if exists "approved settings delete" on public.house_settings;

grant select on public.house_settings to anon, authenticated;
revoke insert, update, delete on public.house_settings from anon;

create policy "public settings select"
on public.house_settings
for select
to anon, authenticated
using (true);

create policy "approved settings insert"
on public.house_settings
for insert
to authenticated
with check (public.is_owner());

create policy "approved settings update"
on public.house_settings
for update
to authenticated
using (public.is_owner())
with check (public.is_owner());

create policy "approved settings delete"
on public.house_settings
for delete
to authenticated
using (public.is_owner());
