-- Create comments table
create table if not exists public.comments (
    comment_id uuid default gen_random_uuid() primary key,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid not null references public.profiles(id) on delete cascade,
    post_id uuid references public.posts(post_id) on delete cascade,
    parent_id uuid references public.comments(comment_id) on delete cascade,
    karma_score bigint default 0,
    is_edited boolean default false
);

-- Create comment_votes table for tracking upvotes/downvotes
create table if not exists public.comment_votes (
    comment_id uuid references public.comments(comment_id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    vote_type smallint check (vote_type in (-1, 1)),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (comment_id, user_id)
);

-- Create function to update comment karma score
create or replace function public.update_comment_karma_score()
returns trigger
language plpgsql
security definer
as $$
begin
  if (TG_OP = 'DELETE') then
    update public.comments
    set karma_score = karma_score - OLD.vote_type
    where comment_id = OLD.comment_id;
    return OLD;
  elsif (TG_OP = 'INSERT') then
    update public.comments
    set karma_score = karma_score + NEW.vote_type
    where comment_id = NEW.comment_id;
    return NEW;
  elsif (TG_OP = 'UPDATE') then
    update public.comments
    set karma_score = karma_score - OLD.vote_type + NEW.vote_type
    where comment_id = NEW.comment_id;
    return NEW;
  end if;
  return null;
end;
$$;

-- Create trigger for karma score updates
create trigger comment_votes_karma_trigger
after insert or update or delete on public.comment_votes
for each row
execute function public.update_comment_karma_score();

-- Create function to update forum post comment count
create or replace function public.update_forum_post_comment_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (TG_OP = 'DELETE') then
    update public.posts
    set comment_count = comment_count - 1
    where post_id = OLD.post_id;
    return OLD;
  elsif (TG_OP = 'INSERT') then
    update public.posts
    set comment_count = comment_count + 1
    where post_id = NEW.post_id;
    return NEW;
  end if;
  return null;
end;
$$;

-- Create trigger for comment count updates
create trigger comments_count_trigger
after insert or delete on public.comments
for each row
execute function public.update_forum_post_comment_count();

-- Add RLS policies
alter table public.comments enable row level security;
alter table public.comment_votes enable row level security;

-- Comments policies
create policy "Comments are viewable by everyone"
on public.comments for select
to public
using (true);

create policy "Authenticated users can create comments"
on public.comments for insert
to authenticated
with check (user_id = auth.uid());

create policy "Comment authors can update their comments"
on public.comments for update
to authenticated
using (
  user_id = auth.uid() or
  exists (
    select 1 from public.posts
    where post_id = comments.post_id
    and exists (
      select 1 from public.community_members
      where community_id = posts.community_id
      and user_id = auth.uid()
      and role in ('admin', 'moderator')
    )
  )
);

create policy "Comment authors and moderators can delete comments"
on public.comments for delete
to authenticated
using (
  user_id = auth.uid() or
  exists (
    select 1 from public.posts
    where post_id = comments.post_id
    and exists (
      select 1 from public.community_members
      where community_id = posts.community_id
      and user_id = auth.uid()
      and role in ('admin', 'moderator')
    )
  )
);

-- Comment votes policies
create policy "Users can view comment votes"
on public.comment_votes for select
to public
using (true);

create policy "Authenticated users can vote on comments"
on public.comment_votes for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own comment votes"
on public.comment_votes for update
to authenticated
using (user_id = auth.uid());

create policy "Users can remove their comment votes"
on public.comment_votes for delete
to authenticated
using (user_id = auth.uid());