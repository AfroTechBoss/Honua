import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Post {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  media?: {
    type: 'image' | 'video' | 'link';
    url: string;
    preview?: string;
  }[];
  likes: number;
  reposts: number;
  comments: number;
  timestamp: string;
}

export interface PostsResponse {
  posts: Post[];
  hasMore: boolean;
}

const postsApi = {
  getPosts: async (page: number = 0): Promise<PostsResponse> => {
    try {
      const response = await axios.get(`${API_URL}/api/posts`, {
        params: { page, limit: 4 },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw new Error('Failed to fetch posts');
    }
  },

  createPost: async (content: string, userId: string): Promise<Post> => {
    try {
      const response = await axios.post(`${API_URL}/api/posts`, {
        content,
        userId,
      });
      return response.data;
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