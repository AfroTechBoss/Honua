create table if not exists public.link_previews (
  url text primary key,
  title text not null,
  description text,
  image text,
  site_name text,
  timestamp bigint not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS policies
alter table public.link_previews enable row level security;

-- Allow public read access
create policy "Link previews are viewable by everyone"
  on public.link_previews
  for select
  using (true);

-- Only allow authenticated users to insert/update
create policy "Users can insert link previews"
  on public.link_previews
  for insert
  with check (auth.role() = 'authenticated');

create policy "Users can update link previews"
  on public.link_previews
  for update
  using (auth.role() = 'authenticated');