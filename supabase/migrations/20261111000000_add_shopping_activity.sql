create table public.shopping_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  domain text not null check (char_length(domain) between 3 and 253),
  created_at timestamptz not null default now()
);

create index shopping_activity_user_created_idx
  on public.shopping_activity (user_id, created_at desc);

alter table public.shopping_activity enable row level security;

create policy "Users read their own shopping activity"
  on public.shopping_activity for select to authenticated
  using (auth.uid() = user_id);

create policy "Users record their own shopping activity"
  on public.shopping_activity for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users clear their own shopping activity"
  on public.shopping_activity for delete to authenticated
  using (auth.uid() = user_id);
