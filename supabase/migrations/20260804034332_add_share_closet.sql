-- Adds the "Share Closet" feature: a per-user profile row holding an
-- unguessable share token and an is_public flag, plus the public read
-- policies it needs. This is the `profiles` table the comment at the
-- bottom of the init migration anticipated, scoped down to just what
-- sharing needs (no username yet — the share link is token-based, not a
-- vanity URL, so there's no uniqueness/availability UX to build).

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  share_token uuid not null unique default gen_random_uuid(),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Owners can see/update/create their own profile row regardless of its
-- public/private state.
create policy "Users manage their own profile"
  on public.profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Anyone (including anonymous visitors hitting /shared/[token]) can look up
-- a profile ONLY once it's been made public. Turning sharing off removes
-- the row from this policy's results immediately, so the old link stops
-- resolving without needing to delete/rotate the token — the token itself
-- is just an unguessable identifier, not the actual security gate.
create policy "Public can view public profiles"
  on public.profiles
  for select
  using (is_public = true);

-- Mirrors the same rule for items: an anonymous visitor can read (never
-- write) another user's items only while that user's profile is public.
create policy "Public can view items of public profiles"
  on public.items
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = items.user_id and p.is_public = true
    )
  );
