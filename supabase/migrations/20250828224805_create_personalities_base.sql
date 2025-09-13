-- creates minimal schema so later migrations (has_memory, updates) pass
create table if not exists public.personalities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  role text,
  has_memory boolean default true,
  created_at timestamptz default now()
);
