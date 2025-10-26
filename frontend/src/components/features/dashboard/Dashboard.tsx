/**
 * Main Dashboard Component for Facebook Auto-Posting Bot
 */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  TrendingUp, 
  Facebook, 
  Settings,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Post, DashboardStats, Image, Category, PostStatus } from '../../../types';

const Dashboard: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_posts: 0,
    published_posts: 0,
    scheduled_posts: 0,
    draft_posts: 0,
    archived_posts: 0,
    success_rate: 0,
    total_images: 0,
    recent_posts_7_days: 0,
    facebook_posted_count: 0,
    average_price: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockPosts: Post[] = [
        {
          id: '1',
          title: 'iPhone 13 Pro Max - Excellent Condition',
          description: 'Barely used iPhone 13 Pro Max in perfect condition. Includes original box and charger.',
          price: 899.99,
          category: 'electronics' as Category,
          location: 'New York, NY',
          status: 'published' as PostStatus,
          images: [{ url: '/api/uploads/iphone1.jpg', filename: 'iphone1.jpg', size: 1024000, uploaded_at: '2024-01-15T10:30:00Z' }],
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
          facebook_post_id: 'fb_12345'
        },
        {
          id: '2',
          title: 'Vintage Leather Jacket - Size Medium',
          description: 'Classic vintage leather jacket in great condition. Perfect for winter.',
          price: 149.99,
          category: 'clothing' as Category,
          location: 'Los Angeles, CA',
          status: 'scheduled' as PostStatus,
          images: [{ url: '/api/uploads/jacket1.jpg', filename: 'jacket1.jpg', size: 875000, uploaded_at: '2024-01-14T15:20:00Z' }],
          created_at: '2024-01-14T15:20:00Z',
          updated_at: '2024-01-14T15:20:00Z',
          scheduled_at: '2024-01-20T12:00:00Z'
        },
        {
          id: '3',
          title: 'Gaming Setup - Complete PC Build',
          description: 'High-end gaming PC with RTX 4080, perfect for streaming and gaming.',
          price: 2499.99,
          category: 'electronics' as Category,
          location: 'Chicago, IL',
          status: 'draft' as PostStatus,
          images: [
            { url: '/api/uploads/pc1.jpg', filename: 'pc1.jpg', size: 1200000, uploaded_at: '2024-01-13T09:15:00Z' },
            { url: '/api/uploads/pc2.jpg', filename: 'pc2.jpg', size: 1100000, uploaded_at: '2024-01-13T09:15:00Z' }
          ],
          created_at: '2024-01-13T09:15:00Z',
          updated_at: '2024-01-13T09:15:00Z'
        }
      ];

      setPosts(mockPosts);
      setStats({
        total_posts: mockPosts.length,
        published_posts: mockPosts.filter(p => p.status === 'published').length,
        scheduled_posts: mockPosts.filter(p => p.status === 'scheduled').length,
        draft_posts: mockPosts.filter(p => p.status === 'draft').length,
        archived_posts: mockPosts.filter(p => p.status === 'archived').length,
        success_rate: 92.5,
        total_images: mockPosts.reduce((acc, p) => acc + p.images.length, 0),
        recent_posts_7_days: mockPosts.length,
        facebook_posted_count: mockPosts.filter(p => p.facebook_post_id).length,
        average_price: mockPosts.reduce((acc, p) => acc + p.price, 0) / mockPosts.length
      });
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'draft':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      case 'archived':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'published':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'scheduled':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'draft':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'archived':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || post.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Facebook className="w-8 h-8 mr-3 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Auto-Posting Bot</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="btn-secondary">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
              <button 
                className="btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-4">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_posts}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{stats.scheduled_posts}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">{stats.published_posts}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.success_rate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  className="pl-10 input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  className="input"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
            <span className="text-sm text-gray-500">{filteredPosts.length} posts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-cell font-medium text-gray-900">Post</th>
                  <th className="table-cell font-medium text-gray-900">Category</th>
                  <th className="table-cell font-medium text-gray-900">Price</th>
                  <th className="table-cell font-medium text-gray-900">Status</th>
                  <th className="table-cell font-medium text-gray-900">Created</th>
                  <th className="table-cell font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          {post.images.length > 0 ? (
                            <img
                              className="object-cover w-10 h-10 rounded-lg"
                              src={post.images[0].url}
                              alt={post.title}
                            />
                          ) : (
                            <div className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-lg">
                              <Eye className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="max-w-xs font-medium text-gray-900 truncate">
                            {post.title}
                          </div>
                          <div className="max-w-xs text-sm text-gray-500 truncate">
                            {post.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-gray-900 capitalize">{post.category}</span>
                    </td>
                    <td className="table-cell">
                      <span className="font-medium text-gray-900">${post.price}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center">
                        {getStatusIcon(post.status)}
                        <span className={`ml-2 ${getStatusBadge(post.status)}`}>
                          {post.status}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-gray-500">
                      {formatDate(post.created_at)}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-1 text-gray-400 hover:text-blue-600"
                          onClick={() => setSelectedPost(post)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-green-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPosts.length === 0 && (
            <div className="py-12 text-center">
              <div className="mb-4 text-gray-400">
                <Plus className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">No posts found</h3>
              <p className="mb-4 text-gray-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first post.'}
              </p>
              <button 
                className="btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals would be implemented here */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <h3 className="mb-4 text-lg font-semibold">Create New Post</h3>
            <p className="mb-4 text-gray-600">Post creation form would be implemented here.</p>
            <div className="flex justify-end space-x-2">
              <button 
                className="btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button className="btn-primary">Create</button>
            </div>
          </div>
        </div>
      )}

      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-2xl p-6 bg-white rounded-lg">
            <h3 className="mb-4 text-lg font-semibold">{selectedPost.title}</h3>
            <p className="mb-4 text-gray-600">{selectedPost.description}</p>
            <div className="flex justify-end">
              <button 
                className="btn-secondary"
                onClick={() => setSelectedPost(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;