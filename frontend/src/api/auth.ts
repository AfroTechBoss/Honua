import { apiClient } from './client';

export interface SignUpData {
  email: string;
  password: string;
  username: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  async signup(data: SignUpData) {
    try {
      const response = await apiClient.post('/auth/signup', data);
      if (response.data.data?.session) {
        localStorage.setItem('authToken', response.data.data.session.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Signup failed');
    }
  },

  async login(data: LoginData) {
    try {
      const response = await apiClient.post('/auth/login', data);
      if (response.data.session) {
        localStorage.setItem('authToken', response.data.session.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export const { login, signup, logout, isAuthenticated, getCurrentUser } = authService;

export const resetPassword = async (email: string) => {
  try {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Password reset request failed');
  }
};