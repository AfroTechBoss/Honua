-- Create communities table
create table if not exists public.communities (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    description text,
    rules text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users(id) on delete set null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    avatar_url text,
    banner_url text,
    is_private boolean default false,
    member_count bigint default 0
);

-- Create community_members table for tracking memberships
create table if not exists public.community_members (
    community_id uuid references public.communities(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    role text default 'member' check (role in ('member', 'moderator', 'admin')),
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (community_id, user_id)
);

-- Create function to update member count
create or replace function public.update_community_member_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (TG_OP = 'DELETE') then
    update public.communities
    set member_count = member_count - 1
    where id = OLD.community_id;
    return OLD;
  elsif (TG_OP = 'INSERT') then
    update public.communities
    set member_count = member_count + 1
    where id = NEW.community_id;
    return NEW;
  end if;
  return null;
end;
$$;

-- Create trigger for member count updates
create trigger community_members_count_trigger
after insert or delete on public.community_members
for each row
execute function public.update_community_member_count();

-- Add RLS policies
alter table public.communities enable row level security;
alter table public.community_members enable row level security;

-- Communities policies
create policy "Communities are viewable by everyone"
on public.communities for select
to public
using (true);

create policy "Users can create communities"
on public.communities for insert
to authenticated
with check (true);

create policy "Community creators can update their communities"
on public.communities for update
to authenticated
using (
  created_by = auth.uid() or
  exists (
    select 1 from public.community_members
    where community_id = id
    and user_id = auth.uid()
    and role in ('admin', 'moderator')
  )
);

-- Community members policies
create policy "Users can view community members"
on public.community_members for select
to public
using (true);

create policy "Users can join communities"
on public.community_members for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can leave communities"
on public.community_members for delete
to authenticated
using (user_id = auth.uid());