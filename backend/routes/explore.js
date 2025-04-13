const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get explore feed
router.get('/', async (req, res) => {
    try {
        const { user_id, filter = 'trending', category, timeframe = '7d' } = req.query;
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 20;
        const offset = page * limit;

        // Call the stored procedure for personalized feed with additional parameters
        const { data, error } = await supabase
            .rpc('get_explore_feed', {
                p_user_id: user_id || null,
                p_limit: limit,
                p_offset: offset,
                p_filter: filter,
                p_category: category || null,
                p_timeframe: timeframe
            });

        if (error) throw error;

        // Fetch additional user data for each post
        const userIds = [...new Set(data.map(post => post.user_id))];
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, full_name')
            .in('id', userIds);

        if (profilesError) throw profilesError;

        // Merge post data with user profiles
        const enrichedPosts = data.map(post => ({
            ...post,
            user: profiles.find(profile => profile.id === post.user_id)
        }));

        res.json({
            status: 'success',
            data: enrichedPosts,
            pagination: {
                page,
                limit,
                offset
            }
        });
    } catch (error) {
        console.error('Error fetching explore feed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch explore feed',
            error: error.message
        });
    }
});

// Update post engagement metrics
router.post('/engagement', async (req, res) => {
    try {
        const { post_id, metric_type, value } = req.body;

        // Validate input
        if (!post_id || !metric_type || value === undefined) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required parameters'
            });
        }

        // Update the specified metric
        const updateData = {};
        switch (metric_type) {
            case 'view':
                updateData.view_count = value;
                break;
            case 'save':
                updateData.save_count = value;
                break;
            case 'view_time':
                updateData.avg_view_time_seconds = value;
                break;
            default:
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid metric type'
                });
        }

        const { data, error } = await supabase
            .from('posts')
            .update(updateData)
            .eq('id', post_id)
            .select();

        if (error) throw error;

        res.json({
            status: 'success',
            data: data[0]
        });
    } catch (error) {
        console.error('Error updating engagement metrics:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update engagement metrics',
            error: error.message
        });
    }
});

module.exports = router;