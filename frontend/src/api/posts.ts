import axios from 'axios';
import { supabase } from '../lib/supabase';
import { API_URL } from './client';

export interface Post {
  id: string;
  content: string;
  user_id: string;
  likes_count: number;
  reposts_count: number;
  comments_count: number;
  media_urls?: string[];
  created_at: string;
  updated_at: string;
  author?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface PostsResponse {
  posts: Post[];
  hasMore: boolean;
}

const postsApi = {
  getPosts: async (page: number = 0, limit: number = 10): Promise<PostsResponse> => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;

      const posts = data.map(post => ({
        ...post,
        author: post.profiles
      }));

      return {
        posts,
        hasMore: data.length === limit
      };
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw new Error('Failed to fetch posts');
    }
  },

  createPost: async (content: string, userId: string): Promise<Post> => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([{
          content,
          user_id: userId
        }])
        .select(`
          *,
          profiles:user_id (username, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      return {
        ...data,
        author: data.profiles
      };
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error('Failed to create post');
    }
  },

  likePost: async (postId: string, userId: string, isLiked: boolean): Promise<Post> => {
    try {
      const response = await axios.post(`${API_URL}/api/posts/${postId}/like`, {
        userId,
        isLiked,
      });
      return response.data;
    } catch (error) {
      console.error('Error liking post:', error);
      throw new Error('Failed to like post');
    }
  },

  repostPost: async (postId: string, userId: string, isReposted: boolean): Promise<Post> => {
    try {
      const response = await axios.post(`${API_URL}/api/posts/${postId}/repost`, {
        userId,
        isReposted,
      });
      return response.data;
    } catch (error) {
      console.error('Error reposting:', error);
      throw new Error('Failed to repost');
    }
  },
};

export default postsApi;