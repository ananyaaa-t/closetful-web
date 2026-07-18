-- Initial schema for Universal Wishlist / Closetful.
-- Uses Supabase's built-in auth.users for identity; no custom users table.

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  collection_id uuid references public.collections (id) on delete set null,
  url text not null,
  name text,
  price numeric,
  image_url text,
  category text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists items_user_id_idx on public.items (user_id);
create index if not exists items_collection_id_idx on public.items (collection_id);
create index if not exists collections_user_id_idx on public.collections (user_id);

alter table public.collections enable row level security;
alter table public.items enable row level security;

-- Owners can fully manage their own rows.
create policy "Users manage their own collections"
  on public.collections
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own items"
  on public.items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow anyone (including anonymous visitors) to read items belonging to a
-- user who has a public profile, powering the /closet/[username] share page.
-- Requires a `profiles` table with a `username` + `is_public` flag, added
-- when the public wishlist page is implemented in Phase 1.
