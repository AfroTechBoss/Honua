-- Create polls table first since posts will reference it
create table if not exists public.polls (
    poll_id uuid default gen_random_uuid() primary key,
    question text not null,
    options jsonb not null, -- Array of poll options
    votes jsonb default '{"options": {}}' not null, -- Track votes per option
    total_votes integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    ends_at timestamp with time zone -- Optional end date for the poll
);

-- Create posts table
create table if not exists public.posts (
    post_id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    community_id uuid references public.communities, -- nullable for main feed posts
    content text not null,
    image_urls text[] default array[]::text[], -- Array of image URLs
    video_urls text[] default array[]::text[], -- Array of video URLs
    media_url text[] default array[]::text[], -- Array of general media URLs
    poll_id uuid references public.polls, -- One-to-one relationship with polls
    likes_count integer default 0,
    comments_count integer default 0,
    reposts_count integer default 0,
    save_count integer default 0,
    view_count integer default 0,
    trending_score float default 0,
    content_score float default 0,
    category text[] default array[]::text[], -- Array of categories/tags
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    is_deleted boolean default false,
    is_hidden boolean default false,
    is_pinned boolean default false,
    metadata jsonb default '{}'
);

-- Create indexes for better query performance
create index if not exists posts_user_id_idx on public.posts(user_id);
create index if not exists posts_community_id_idx on public.posts(community_id);
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_trending_score_idx on public.posts(trending_score desc);

-- Add RLS policies
alter table public.posts enable row level security;

-- Allow anyone to view non-hidden posts
create policy "Anyone can view non-hidden posts"
    on public.posts for select
    using (not is_hidden and not is_deleted);

-- Allow authenticated users to create posts
create policy "Authenticated users can create posts"
    on public.posts for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Allow users to update their own posts
create policy "Users can update own posts"
    on public.posts for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Add function to update updated_at timestamp
create or replace function public.handle_updated_at()
    returns trigger
    language plpgsql
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

-- Create trigger to automatically update updated_at
create trigger handle_posts_updated_at
    before update
    on public.posts
    for each row
    execute function public.handle_updated_at();