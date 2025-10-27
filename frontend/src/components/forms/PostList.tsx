'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Trash2, MapPin, DollarSign, Calendar, Filter, Search, RefreshCw, Eye, Grid, List as ListIcon, SortAsc, SortDesc } from 'lucide-react';
import { Post, PostsResponse, PostFilter, PaginationParams, Category, PostStatus } from '../../types';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { EmptyState } from '../EmptyState';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PostListProps {
  onEditPost?: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
}

type ViewMode = 'grid' | 'list';
type SortOrder = 'asc' | 'desc';

export default function PostList({ onEditPost, onDeletePost }: PostListProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<PostFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Modal states
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');

    try {
      const pagination: PaginationParams = {
        skip: (page - 1) * 12,
        limit: 12,
      };
      
      const response = await api.getPosts(filters, pagination);

      let fetchedPosts = response.posts;
      
      // Apply client-side search if query exists
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        fetchedPosts = fetchedPosts.filter(post => 
          post.title.toLowerCase().includes(query) ||
          post.description.toLowerCase().includes(query) ||
          post.location.toLowerCase().includes(query)
        );
      }

      // Apply client-side sorting
      fetchedPosts.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });

      setPosts(fetchedPosts);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, filters]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchPosts();
      } else {
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, sortOrder]);

  const handleDeletePost = async () => {
    if (!selectedPost) return;

    setDeleteLoading(true);
    try {
      await api.deletePost(selectedPost.id);
      await fetchPosts();
      if (onDeletePost) {
        onDeletePost(selectedPost.id);
      }
      setShowDeleteModal(false);
      setSelectedPost(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete post');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string, scheduledAt?: string | null) => {
    switch (status) {
      case 'published':
        return <Badge variant="success">Published</Badge>;
      case 'scheduled':
        return (
          <div className="flex items-center gap-1">
            <Badge variant="warning">Scheduled</Badge>
            {scheduledAt && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({formatDate(scheduledAt)})
              </span>
            )}
          </div>
        );
      case 'draft':
        return <Badge variant="default">Draft</Badge>;
      case 'archived':
        return <Badge variant="default">Archived</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
  };

  if (loading && posts.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
              />
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading posts...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search posts by title, description, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                animated={false}
              />
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'secondary'}
                size="sm"
                icon={<Grid className="w-4 h-4" />}
                onClick={() => setViewMode('grid')}
              />
              <Button
                variant={viewMode === 'list' ? 'primary' : 'secondary'}
                size="sm"
                icon={<ListIcon className="w-4 h-4" />}
                onClick={() => setViewMode('list')}
              />
              <Button
                variant="secondary"
                size="sm"
                icon={sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              />
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={fetchPosts}
              />
              <Button
                variant={showFilters ? 'primary' : 'secondary'}
                size="sm"
                icon={<Filter className="w-4 h-4" />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category
                      </label>
                      <select
                        value={filters.category || ''}
                        onChange={(e) => {
                          setFilters({ ...filters, category: (e.target.value as Category) || undefined });
                          setPage(1);
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">All Categories</option>
                        <option value="vehicles">🚗 Vehicles</option>
                        <option value="property-rentals">🏠 Property Rentals</option>
                        <option value="apparel">👕 Apparel</option>
                        <option value="electronics">💻 Electronics</option>
                        <option value="entertainment">🎮 Entertainment</option>
                        <option value="family">👨‍👩‍👧 Family</option>
                        <option value="garden-outdoor">🌻 Garden & Outdoor</option>
                        <option value="hobbies">🎨 Hobbies</option>
                        <option value="home-goods">🛋️ Home Goods</option>
                        <option value="home-improvement-supplies">🔨 Home Improvement</option>
                        <option value="sporting-goods">⚽ Sporting Goods</option>
                        <option value="toys-games">🎲 Toys & Games</option>
                        <option value="other">📦 Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={filters.status || ''}
                        onChange={(e) => {
                          setFilters({ ...filters, status: (e.target.value as PostStatus) || undefined });
                          setPage(1);
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={filters.location || ''}
                        onChange={(e) => {
                          setFilters({ ...filters, location: e.target.value || undefined });
                          setPage(1);
                        }}
                        placeholder="Filter by location"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
        >
          <div className="text-red-800 dark:text-red-400 font-medium">{error}</div>
        </motion.div>
      )}

      {/* Posts Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Your Posts
            </CardTitle>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {total} {total === 1 ? 'post' : 'posts'} total
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {posts.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No posts found"
              description={
                searchQuery || Object.keys(filters).length > 0
                  ? "No posts match your search criteria. Try adjusting your filters."
                  : "You haven't created any posts yet. Create your first post to get started!"
              }
              actionLabel={!(searchQuery || Object.keys(filters).length > 0) ? "Create Post" : undefined}
              onAction={() => window.location.href = '/create'}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative"
                >
                  <Card className="h-full hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600">
                    {/* Image Preview */}
                    {post.images && post.images.length > 0 ? (
                      <div className="relative h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <img
                          src={post.images[0].url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2">
                          {getStatusBadge(post.status, post.scheduled_at)}
                        </div>
                        {post.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded-lg backdrop-blur-sm">
                            +{post.images.length - 1} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                        <div className="absolute top-2 right-2">
                          {getStatusBadge(post.status, post.scheduled_at)}
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {post.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {post.description}
                      </p>
                      
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-bold text-green-600 dark:text-green-400">
                            <DollarSign className="w-4 h-4" />
                            ${post.price.toFixed(2)}
                          </span>
                          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(post.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">{post.location}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                          onClick={() => router.push(`/posts/${post.id}`)}
                          className="flex-1"
                        >
                          View
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Edit className="w-4 h-4" />}
                          onClick={() => router.push(`/posts/${post.id}/edit`)}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => {
                            setSelectedPost(post);
                            setShowDeleteModal(true);
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group"
                >
                  <Card className="hover:shadow-lg transition-all duration-300 border-2 border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-6">
                        {/* Image Thumbnail */}
                        {post.images && post.images.length > 0 ? (
                          <div className="relative w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                            <img
                              src={post.images[0].url}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            {post.images.length > 1 && (
                              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded backdrop-blur-sm">
                                +{post.images.length - 1}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center flex-shrink-0">
                            <Package className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {post.title}
                                </h3>
                                {getStatusBadge(post.status, post.scheduled_at)}
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                                {post.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                            <span className="flex items-center gap-1.5 font-bold text-green-600 dark:text-green-400 text-lg">
                              <DollarSign className="w-5 h-5" />
                              ${post.price.toFixed(2)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {post.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(post.created_at)}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Eye className="w-4 h-4" />}
                              onClick={() => router.push(`/posts/${post.id}`)}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Edit className="w-4 h-4" />}
                              onClick={() => router.push(`/posts/${post.id}/edit`)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={<Trash2 className="w-4 h-4" />}
                              onClick={() => {
                                setSelectedPost(post);
                                setShowDeleteModal(true);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1 || loading}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      disabled={loading}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        page === pageNum
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      } disabled:opacity-50`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <Button
                variant="secondary"
                size="sm"
                disabled={page === totalPages || loading}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedPost(null);
        }}
        onConfirm={handleDeletePost}
        title="Delete Post"
        message={`Are you sure you want to delete "${selectedPost?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
