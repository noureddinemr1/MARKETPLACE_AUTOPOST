'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Tag, 
  Image as ImageIcon, 
  Clock,
  ExternalLink,
  Facebook,
  Loader2,
  AlertCircle,
  CheckCircle,
  Share2,
  FileText
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import api from '@/services/api';
import { Post } from '@/types';

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { toasts, removeToast, success, error: showError } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<number>(0);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.getPost(postId);
      setPost(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch post');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.deletePost(postId);
      success('Post deleted', 'The post has been deleted successfully.');
      setTimeout(() => {
        router.push('/posts');
      }, 1500);
    } catch (err: any) {
      showError('Delete failed', err.response?.data?.detail || 'Failed to delete post');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="success">Published</Badge>;
      case 'scheduled':
        return <Badge variant="warning">Scheduled</Badge>;
      case 'draft':
        return <Badge variant="default">Draft</Badge>;
      case 'archived':
        return <Badge variant="default">Archived</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-inherit">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-3 border-blue-500 rounded-full border-t-transparent"
          />
          <p className="text-base font-medium text-gray-600 dark:text-gray-400">Loading post details...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-inherit">
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full dark:bg-red-900/30"
            >
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </motion.div>
            <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Post Not Found</h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{error || 'This post does not exist or has been deleted.'}</p>
            <Button variant="primary" size="md" onClick={() => router.push('/posts')}>
              Back to Posts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-inherit">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Breadcrumb & Back Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => router.push('/posts')}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Back to Posts
        </Button>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onClick={() => router.push('/posts')}>Posts</span>
          <span>/</span>
          <span className="font-medium text-gray-900 truncate dark:text-white max-w-[200px]">{post.title}</span>
        </div>
      </motion.div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden border-2 border-gray-200 shadow-lg dark:border-gray-800 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 min-w-0">
                {/* Status & Date */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {getStatusBadge(post.status)}
                  <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    Posted {formatDate(post.created_at)}
                  </span>
                </div>
                
                {/* Title */}
                <h1 className="mb-3 text-2xl font-black leading-tight text-gray-900 sm:text-3xl dark:text-white">
                  {post.title}
                </h1>
                
                {/* Price Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 text-xl font-bold text-white rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg shadow-green-500/30">
                  <DollarSign className="w-5 h-5" />
                  {post.price.toFixed(2)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 lg:flex-nowrap">
                <Button
                  variant="primary"
                  size="md"
                  icon={<Edit className="w-4 h-4" />}
                  onClick={() => router.push(`/posts/${post.id}/edit`)}
                  className="flex-1 shadow-lg lg:flex-initial hover:shadow-xl"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setShowDeleteModal(true)}
                  className="flex-1 shadow-lg lg:flex-initial hover:shadow-xl"
                >
                  Delete
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Share2 className="w-4 h-4" />}
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    success('Link copied', 'Post link copied to clipboard');
                  }}
                  className="flex-1 lg:flex-initial"
                >
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Images Gallery */}
          {post.images && post.images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="overflow-hidden border-2 border-gray-200 shadow-lg dark:border-gray-800">
                <CardContent className="p-0">
                  {/* Main Image Display */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 aspect-video group">
                    <motion.img
                      key={selectedImage}
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      src={post.images[selectedImage].url}
                      alt={`${post.title} - Image ${selectedImage + 1}`}
                      className="object-contain w-full h-full"
                    />
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-t from-black/60 via-transparent to-transparent group-hover:opacity-100" />
                    
                    {/* Image Navigation Arrows */}
                    {post.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedImage((selectedImage - 1 + post.images.length) % post.images.length)}
                          className="absolute p-2 text-white transition-all transform -translate-y-1/2 bg-black/50 rounded-full left-4 top-1/2 hover:bg-black/70 backdrop-blur-sm hover:scale-110"
                        >
                          <ArrowLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => setSelectedImage((selectedImage + 1) % post.images.length)}
                          className="absolute p-2 text-white transition-all transform -translate-y-1/2 bg-black/50 rounded-full right-4 top-1/2 hover:bg-black/70 backdrop-blur-sm hover:scale-110"
                        >
                          <ArrowLeft className="w-6 h-6 rotate-180" />
                        </button>
                      </>
                    )}
                    
                    {/* Image Counter Badge */}
                    <div className="absolute flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black/70 rounded-xl top-4 right-4 backdrop-blur-sm">
                      <ImageIcon className="w-4 h-4" />
                      {selectedImage + 1} / {post.images.length}
                    </div>

                    {/* Full Screen Button */}
                    <button
                      onClick={() => window.open(post.images[selectedImage].url, '_blank')}
                      className="absolute p-2 text-white transition-all bg-black/50 rounded-full bottom-4 right-4 hover:bg-black/70 backdrop-blur-sm hover:scale-110"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Thumbnail Grid */}
                  {post.images.length > 1 && (
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50">
                      <div className="flex gap-3 pb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                        {post.images.map((image, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedImage(index)}
                            className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                              selectedImage === index
                                ? 'border-blue-500 shadow-lg ring-2 ring-blue-500/50'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 shadow-md'
                            }`}
                          >
                            <img
                              src={image.url}
                              alt={`Thumbnail ${index + 1}`}
                              className="object-cover w-full h-full"
                            />
                            {selectedImage === index && (
                              <div className="absolute inset-0 bg-blue-500/20" />
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2 border-gray-200 shadow-lg dark:border-gray-800">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Description
                  </h2>
                </div>
                <div className="p-6 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50">
                  <p className="text-base leading-relaxed text-gray-700 whitespace-pre-wrap sm:text-lg dark:text-gray-300">
                    {post.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-gray-200 shadow-lg dark:border-gray-800 sticky top-6">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-cyan-500" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Post Details
                  </h3>
                </div>

                {/* Category */}
                <div className="flex items-start gap-3 p-4 transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl hover:shadow-md">
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                    <Tag className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400 mb-1">Category</p>
                    <p className="text-base font-bold text-gray-900 capitalize dark:text-white">
                      {post.category.replace(/-/g, ' ')}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3 p-4 transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl hover:shadow-md">
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400 mb-1">Location</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">
                      {post.location}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-start gap-3 p-4 transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl hover:shadow-md">
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400 mb-1">Price</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white">
                      ${post.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Scheduled Date */}
                {post.scheduled_at && (
                  <div className="flex items-start gap-3 p-4 transition-all duration-300 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl hover:shadow-md">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400 mb-1">Scheduled For</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatDate(post.scheduled_at)}
                      </p>
                    </div>
                  </div>
                )}
                </CardContent>
              </Card>
            </motion.div>

          {/* Meta Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2 border-gray-200 shadow-lg dark:border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Information
                  </h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 transition-all rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Calendar className="w-4 h-4 mt-0.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Created</p>
                      <p className="text-sm font-semibold text-gray-900 truncate dark:text-white">{formatDate(post.created_at)}</p>
                    </div>
                  </div>
                  
                  {post.updated_at !== post.created_at && (
                    <div className="flex items-start gap-3 p-3 transition-all rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Calendar className="w-4 h-4 mt-0.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Updated</p>
                        <p className="text-sm font-semibold text-gray-900 truncate dark:text-white">{formatDate(post.updated_at)}</p>
                      </div>
                    </div>
                  )}

                  {post.images && post.images.length > 0 && (
                    <div className="flex items-start gap-3 p-3 transition-all rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <ImageIcon className="w-4 h-4 mt-0.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Images</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {post.images.length} {post.images.length === 1 ? 'image' : 'images'}
                        </p>
                      </div>
                    </div>
                  )}

                  {post.facebook_post_id && (
                    <div className="flex items-start gap-3 p-3 transition-all bg-blue-50 rounded-lg dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                      <Facebook className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div className="flex items-center justify-between flex-1">
                        <div>
                          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Facebook Status</p>
                          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Posted</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-2 border-gray-200 shadow-lg dark:border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 rounded-full bg-gradient-to-b from-pink-500 to-rose-500" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Quick Actions
                  </h3>
                </div>
                <div className="space-y-3">
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<Share2 className="w-4 h-4" />}
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      success('Link copied', 'Post link copied to clipboard');
                    }}
                    className="justify-start w-full"
                  >
                    Copy Share Link
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<ExternalLink className="w-4 h-4" />}
                    onClick={() => window.open(`/posts/${post.id}`, '_blank')}
                    className="justify-start w-full"
                  >
                    Open in New Tab
                  </Button>
                  {post.facebook_post_id && (
                    <Button
                      variant="secondary"
                      size="md"
                      icon={<Facebook className="w-4 h-4" />}
                      onClick={() => window.open(`https://facebook.com/${post.facebook_post_id}`, '_blank')}
                      className="justify-start w-full"
                    >
                      View on Facebook
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message={`Are you sure you want to delete "${post.title}"? This action cannot be undone.`}
        confirmText="Delete Post"
        cancelText="Cancel"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
