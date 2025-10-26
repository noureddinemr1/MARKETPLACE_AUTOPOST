/**
 * Type definitions for the Facebook Auto-Posting Bot application.
 */

export interface Post {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  location: string;
  status: PostStatus;
  images: Image[];
  created_at: string;
  updated_at: string;
  scheduled_at?: string | null;
  facebook_post_id?: string | null;
}

export interface PostCreate {
  title: string;
  description: string;
  price: number;
  category: Category;
  location: string;
  status?: PostStatus;
  scheduled_at?: string | null;
}

export interface PostUpdate {
  title?: string;
  description?: string;
  price?: number;
  category?: Category;
  location?: string;
  status?: PostStatus;
  scheduled_at?: string | null;
}

export interface Image {
  filename: string;
  url: string;
  size: number;
  uploaded_at: string;
}

export type Category = 
  | 'vehicles'
  | 'property-rentals'
  | 'apparel'
  | 'electronics'
  | 'entertainment'
  | 'family'
  | 'garden-outdoor'
  | 'hobbies'
  | 'home-goods'
  | 'home-improvement-supplies'
  | 'home-sales'
  | 'musical-instruments'
  | 'office-supplies'
  | 'pet-supplies'
  | 'sporting-goods'
  | 'toys-games'
  | 'other';

export type PostStatus = 
  | 'draft' 
  | 'published' 
  | 'scheduled' 
  | 'archived';

export interface PostFilter {
  category?: Category;
  status?: PostStatus;
  location?: string;
  min_price?: number;
  max_price?: number;
}

export interface PaginationParams {
  skip: number;
  limit: number;
}

export interface PostsResponse {
  posts: Post[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_info: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  tasks?: string[];
}

export interface FacebookTokenValidation {
  valid: boolean;
  user_info?: {
    user_id: string;
    user_name: string;
    email: string;
  };
  pages?: FacebookPage[];
  error?: string;
}

export interface SchedulePostRequest {
  post_id: string;
  scheduled_at: string;
  facebook_access_token?: string;
}

export interface FacebookPostRequest {
  message: string;
  access_token: string;
  page_id?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ScheduledJob {
  post_id: string;
  scheduled_at: string;
  job_id: string;
}

// Form types
export interface PostFormData extends PostCreate {
  images?: FileList;
}

export interface ScheduleFormData {
  scheduled_at: Date;
  facebook_access_token?: string;
}

// Table types
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
}

// Hook types
export interface UsePostsOptions {
  filters?: PostFilter;
  pagination?: PaginationParams;
  enabled?: boolean;
}

export interface UsePostsResult {
  posts: Post[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// UI Component types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'facebook';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface StatusBadgeProps {
  status: PostStatus;
  className?: string;
}

export interface ImageUploaderProps {
  onImagesSelected: (files: File[]) => void;
  maxImages?: number;
  currentImages?: Image[];
  onImageRemove?: (filename: string) => void;
}

// Dashboard types
export interface DashboardStats {
  total_posts: number;
  published_posts: number;
  scheduled_posts: number;
  draft_posts: number;
  archived_posts: number;
  success_rate: number;
  total_images: number;
  recent_posts_7_days: number;
  facebook_posted_count: number;
  average_price: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  post_title: string;
  time: string;
  status: 'success' | 'pending' | 'draft' | 'archived' | 'unknown';
  created_at: string;
  updated_at: string;
}

export interface CategoryDistribution {
  category: string;
  count: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface PostingTrend {
  date: string;
  count: number;
}

// Error types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}