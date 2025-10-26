/**
 * API service for the Facebook Auto-Posting Bot frontend.
 */
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  Post,
  PostCreate,
  PostUpdate,
  PostsResponse,
  AuthToken,
  LoginCredentials,
  RegisterData,
  FacebookTokenValidation,
  SchedulePostRequest,
  FacebookPostRequest,
  ApiResponse,
  ScheduledJob,
  PostFilter,
  PaginationParams,
  DashboardStats,
  RecentActivity,
  CategoryDistribution,
  StatusDistribution,
  PostingTrend,
} from '@/types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.removeToken();
          // Redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    const response = await this.api.post<AuthToken>('/auth/login', credentials);
    this.setToken(response.data.access_token);
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthToken> {
    const response = await this.api.post<AuthToken>('/auth/register', data);
    this.setToken(response.data.access_token);
    return response.data;
  }

  async getCurrentUser(): Promise<any> {
    const response = await this.api.get('/api/v1/auth/me');
    return response.data;
  }

  async validateFacebookToken(access_token: string): Promise<FacebookTokenValidation> {
    const response = await this.api.post<FacebookTokenValidation>(
      '/api/v1/auth/facebook/validate',
      { access_token }
    );
    return response.data;
  }

  // Post endpoints
  async getPosts(filters?: PostFilter, pagination?: PaginationParams): Promise<PostsResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.location) params.append('location', filters.location);
      if (filters.min_price !== undefined) params.append('min_price', filters.min_price.toString());
      if (filters.max_price !== undefined) params.append('max_price', filters.max_price.toString());
    }
    
    if (pagination) {
      params.append('skip', pagination.skip.toString());
      params.append('limit', pagination.limit.toString());
    }

    const response = await this.api.get<PostsResponse>(`/api/v1/posts?${params.toString()}`);
    return response.data;
  }

  async getPost(postId: string): Promise<Post> {
    const response = await this.api.get<Post>(`/api/v1/posts/${postId}`);
    return response.data;
  }

  async createPost(postData: PostCreate): Promise<Post> {
    const response = await this.api.post<Post>('/api/v1/posts', postData);
    return response.data;
  }

  async updatePost(postId: string, updateData: PostUpdate): Promise<Post> {
    const response = await this.api.put<Post>(`/api/v1/posts/${postId}`, updateData);
    return response.data;
  }

  async deletePost(postId: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(`/api/v1/posts/${postId}`);
    return response.data;
  }

  // Image endpoints
  async uploadImages(postId: string, files: File[]): Promise<Post> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await this.api.post<Post>(
      `/api/v1/posts/${postId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async removeImage(postId: string, imageFilename: string): Promise<Post> {
    const response = await this.api.delete<Post>(`/api/v1/posts/${postId}/images/${imageFilename}`);
    return response.data;
  }

  // Scheduling endpoints
  async schedulePost(scheduleData: SchedulePostRequest): Promise<ApiResponse> {
    const response = await this.api.post<ApiResponse>(
      `/api/v1/posts/${scheduleData.post_id}/schedule`,
      scheduleData
    );
    return response.data;
  }

  async cancelScheduledPost(postId: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(`/api/v1/posts/${postId}/schedule`);
    return response.data;
  }

  async getScheduledJobs(): Promise<{ jobs: ScheduledJob[] }> {
    const response = await this.api.get<{ jobs: ScheduledJob[] }>('/api/v1/posts/scheduled/jobs');
    return response.data;
  }

  // Facebook endpoints
  async postToFacebookPage(
    postId: string,
    pageId: string,
    facebookData: FacebookPostRequest
  ): Promise<ApiResponse> {
    const response = await this.api.post<ApiResponse>(
      `/api/v1/posts/${postId}/facebook/page?page_id=${pageId}`,
      facebookData
    );
    return response.data;
  }

  async postToFacebookMarketplace(
    postId: string,
    facebookData: FacebookPostRequest
  ): Promise<ApiResponse> {
    const response = await this.api.post<ApiResponse>(
      `/api/v1/posts/${postId}/facebook/marketplace`,
      facebookData
    );
    return response.data;
  }

  async deleteFacebookPost(facebookPostId: string, accessToken: string): Promise<ApiResponse> {
    const response = await this.api.delete<ApiResponse>(
      `/api/v1/posts/facebook/${facebookPostId}?access_token=${accessToken}`
    );
    return response.data;
  }

  // Payment endpoints
  async createPaymentIntent(data: { amount: number; currency: string; description: string }): Promise<any> {
    const response = await this.api.post('/payments/create-intent', data);
    return response.data;
  }

  async capturePayment(paymentIntentId: string): Promise<any> {
    const response = await this.api.post(`/payments/capture`, { payment_intent_id: paymentIntentId });
    return response.data;
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<any> {
    const response = await this.api.post(`/payments/refund`, { 
      payment_intent_id: paymentIntentId,
      amount 
    });
    return response.data;
  }

  async getPaymentHistory(): Promise<any> {
    const response = await this.api.get('/payments/history');
    return response.data;
  }

  // Utility methods
  async healthCheck(): Promise<any> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.api.get<DashboardStats>('/api/v1/dashboard/stats');
    return response.data;
  }

  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    const response = await this.api.get<RecentActivity[]>(`/api/v1/dashboard/recent-activity?limit=${limit}`);
    return response.data;
  }

  async getCategoryDistribution(): Promise<CategoryDistribution[]> {
    const response = await this.api.get<CategoryDistribution[]>('/api/v1/dashboard/category-distribution');
    return response.data;
  }

  async getStatusDistribution(): Promise<StatusDistribution[]> {
    const response = await this.api.get<StatusDistribution[]>('/api/v1/dashboard/status-distribution');
    return response.data;
  }

  async getPostingTrend(days: number = 7): Promise<PostingTrend[]> {
    const response = await this.api.get<PostingTrend[]>(`/api/v1/dashboard/posting-trend?days=${days}`);
    return response.data;
  }

  // Analytics endpoints
  async getAnalyticsOverview(): Promise<any> {
    const response = await this.api.get('/api/v1/analytics/overview');
    return response.data;
  }

  async getPostsOverTime(days: number = 30): Promise<any[]> {
    const response = await this.api.get(`/api/v1/analytics/posts-over-time?days=${days}`);
    return response.data;
  }

  async getAnalyticsCategoryDistribution(): Promise<any[]> {
    const response = await this.api.get('/api/v1/analytics/category-distribution');
    return response.data;
  }

  async getAnalyticsStatusDistribution(): Promise<any[]> {
    const response = await this.api.get('/api/v1/analytics/status-distribution');
    return response.data;
  }

  async getPriceDistribution(): Promise<any> {
    const response = await this.api.get('/api/v1/analytics/price-distribution');
    return response.data;
  }

  async getLocationDistribution(): Promise<any[]> {
    const response = await this.api.get('/api/v1/analytics/location-distribution');
    return response.data;
  }

  async getAnalyticsRecentActivity(days: number = 7): Promise<any[]> {
    const response = await this.api.get(`/api/v1/analytics/recent-activity?days=${days}`);
    return response.data;
  }

  logout(): void {
    this.removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // Generic HTTP methods for external use
  async get<T>(url: string): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url);
  }

  async post<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data);
  }

  async put<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data);
  }

  async delete<T>(url: string): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url);
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;