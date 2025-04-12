-- Create followers table
create table if not exists public.followers (
    follower_id uuid references auth.users(id) on delete cascade,
    following_id uuid references auth.users(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (follower_id, following_id)
);

-- Add RLS policies
alter table public.followers enable row level security;

-- Followers policies
create policy "Followers are viewable by everyone"
on public.followers for select
to public
using (true);

create policy "Authenticated users can follow others"
on public.followers for insert
to authenticated
with check (follower_id = auth.uid());

create policy "Users can unfollow others"
on public.followers for delete
to authenticated
using (follower_id = auth.uid());