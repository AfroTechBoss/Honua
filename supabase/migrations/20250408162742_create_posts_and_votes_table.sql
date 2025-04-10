-- Create forum_posts table
create table if not exists public.forum_posts (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    content text,
    media_url text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    author_id uuid references auth.users(id) on delete set null,
    community_id uuid references public.communities(id) on delete cascade,
    karma_score bigint default 0,
    comment_count bigint default 0,
    post_type text default 'text' check (post_type in ('text', 'link', 'image', 'video')),
    is_pinned boolean default false,
    is_locked boolean default false
);

-- Create forum_post_votes table for tracking upvotes/downvotes
create table if not exists public.forum_post_votes (
    post_id uuid references public.forum_posts(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    vote_type smallint check (vote_type in (-1, 1)),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (post_id, user_id)
);

-- Create function to update forum post karma score
create or replace function public.update_forum_post_karma_score()
returns trigger
language plpgsql
security definer
as $$
begin
  if (TG_OP = 'DELETE') then
    update public.forum_posts
    set karma_score = karma_score - OLD.vote_type
    where id = OLD.post_id;
    return OLD;
  elsif (TG_OP = 'INSERT') then
    update public.forum_posts
    set karma_score = karma_score + NEW.vote_type
    where id = NEW.post_id;
    return NEW;
  elsif (TG_OP = 'UPDATE') then
    update public.forum_posts
    set karma_score = karma_score - OLD.vote_type + NEW.vote_type
    where id = NEW.post_id;
    return NEW;
  end if;
  return null;
end;
$$;

-- Create trigger for karma score updates
create trigger forum_post_votes_karma_trigger
after insert or update or delete on public.forum_post_votes
for each row
execute function public.update_forum_post_karma_score();

-- Add RLS policies
alter table public.forum_posts enable row level security;
alter table public.forum_post_votes enable row level security;

-- Forum posts policies
create policy "Forum posts are viewable by everyone"
on public.forum_posts for select
to public
using (true);

create policy "Authenticated users can create forum posts"
on public.forum_posts for insert
to authenticated
with check (author_id = auth.uid());

create policy "Forum post authors can update their posts"
on public.forum_posts for update
to authenticated
using (
  author_id = auth.uid() or
  exists (
    select 1 from public.community_members
    where community_id = forum_posts.community_id
    and user_id = auth.uid()
    and role in ('admin', 'moderator')
  )
);

create policy "Forum post authors and moderators can delete posts"
on public.forum_posts for delete
to authenticated
using (
  author_id = auth.uid() or
  exists (
    select 1 from public.community_members
    where community_id = forum_posts.community_id
    and user_id = auth.uid()
    and role in ('admin', 'moderator')
  )
);

-- Forum post votes policies
create policy "Users can view forum post votes"
on public.forum_post_votes for select
to public
using (true);

create policy "Authenticated users can vote on forum posts"
on public.forum_post_votes for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own forum votes"
on public.forum_post_votes for update
to authenticated
using (user_id = auth.uid());

create policy "Users can remove their forum votes"
on public.forum_post_votes for delete
to authenticated
using (user_id = auth.uid());