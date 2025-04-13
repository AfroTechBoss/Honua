-- Drop existing function if it exists
drop function if exists get_explore_feed(uuid, integer, integer, text, text, text);

-- Create function to calculate weighted post scores and return personalized explore feed
create function get_explore_feed(
    p_user_id uuid,
    p_limit integer,
    p_offset integer,
    p_filter text default 'trending',
    p_category text default null,
    p_timeframe text default '7d'
) returns table (
    post_id uuid,
    user_id uuid,
    content text,
    image_urls text[],
    video_urls text[],
    poll_id uuid,
    likes_count integer,
    comments_count integer,
    reposts_count integer,
    save_count integer,
    view_count integer,
    trending_score float,
    content_score float,
    category text[],
    created_at timestamp with time zone
) language plpgsql security definer as $$
declare
    engagement_weight float := 0.4;
    freshness_weight float := 0.2;
    quality_weight float := 0.2;
    personalization_weight float := 0.2;
    max_age_hours float := 72.0; -- Consider posts from last 72 hours for trending
begin
    return query
    with user_interests as (
        -- Get categories user has engaged with
        select distinct unnest(p.category) as category
        from posts p
        inner join social_interactions si on si.post_id = p.id
        where si.user_id = p_user_id
        and si.interaction_type in ('like', 'repost', 'save')
    ),
    post_scores as (
        select 
            p.*,
            -- Engagement score (normalized likes, comments, reposts, saves)
            ((
                (p.likes_count * 1.0) + 
                (p.comments_count * 1.5) + 
                (p.reposts_count * 2.0) + 
                (p.save_count * 2.5)
            ) / nullif(p.view_count, 0)) * engagement_weight as engagement_score,
            
            -- Freshness score (exponential decay)
            exp(-extract(epoch from (now() - p.created_at)) / (max_age_hours * 3600)) * freshness_weight as freshness_score,
            
            -- Content quality score
            case 
                when p.content_score is not null then p.content_score * quality_weight
                else 0
            end as quality_score,
            
            -- Personalization score
            case when p_user_id is not null then
                (
                    select count(*) * personalization_weight
                    from unnest(p.category) pc
                    inner join user_interests ui on ui.category = pc
                )
                else 0
            end as personalization_score
        from posts p
        where p.created_at >= now() - (p_timeframe::interval)
        and p.is_deleted = false
        and p.is_hidden = false
        and (p_category is null or p.category && array[p_category])
    )
    select 
        ps.id as post_id,
        ps.user_id,
        ps.content,
        ps.image_urls,
        ps.video_urls,
        ps.poll_id,
        ps.likes_count,
        ps.comments_count,
        ps.reposts_count,
        ps.save_count,
        ps.view_count,
        ps.trending_score,
        ps.content_score,
        ps.category,
        ps.created_at
    from post_scores ps
    order by case p_filter
        when 'trending' then (
        ps.engagement_score + 
        ps.freshness_score + 
        ps.quality_score + 
        ps.personalization_score
    )
        when 'latest' then ps.created_at
        when 'top' then (ps.likes_count + ps.comments_count + ps.reposts_count)
        else ps.created_at
    end desc
    limit p_limit
    offset p_offset;
end;
$$;