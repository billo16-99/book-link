-- Book Link schema for Supabase (single-user mode)
-- Run this once in the Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at bigint not null default 0,
  owner      text not null default 'owner'
);

create index if not exists categories_owner_idx on categories (owner);
create unique index if not exists categories_owner_name_idx on categories (owner, lower(name));

create table if not exists links (
  id          uuid primary key default gen_random_uuid(),
  url         text not null,
  title       text not null default '',
  description text not null default '',
  image       text not null default '',
  category_id uuid references categories (id) on delete set null,
  status      text not null default 'draft' check (status in ('draft', 'saved')),
  created_at  bigint not null default 0,
  owner       text not null default 'owner'
);

create index if not exists links_owner_idx on links (owner);

create table if not exists profiles (
  id           text primary key,
  display_name text not null default '',
  owner        text not null default 'owner'
);

alter table links enable row level security;
alter table categories enable row level security;
alter table profiles enable row level security;

-- Single-user mode: anon access to rows owned by 'owner'.
-- Replace these with per-user policies when adding authentication.
create policy links_anon_all on links
  for all to anon using (owner = 'owner') with check (owner = 'owner');

create policy categories_anon_all on categories
  for all to anon using (owner = 'owner') with check (owner = 'owner');

create policy profiles_anon_all on profiles
  for all to anon using (owner = 'owner') with check (owner = 'owner');

-- Seed defaults (matching the previous localStorage seeds)
insert into categories (id, name, created_at, owner)
values
  (gen_random_uuid(), 'Read Later', 1, 'owner'),
  (gen_random_uuid(), 'Tools',      2, 'owner'),
  (gen_random_uuid(), 'Inspiration',3, 'owner'),
  (gen_random_uuid(), 'Shopping',   4, 'owner')
on conflict (owner, lower(name)) do nothing;

insert into profiles (id, display_name, owner)
values ('me', '', 'owner')
on conflict (id) do nothing;