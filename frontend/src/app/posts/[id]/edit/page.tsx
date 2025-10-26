'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, AlertCircle, Loader2, Eye, Sparkles, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import PostForm from '@/components/features/posts/PostForm';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import api from '@/services/api';
import { Post } from '@/types';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { toasts, removeToast, success, error: showError } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleSuccess = () => {
    success('Post updated!', 'Your changes have been saved successfully.');
    setTimeout(() => {
      router.push(`/posts/${postId}`);
    }, 1500);
  };

  const features = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Easy Updates",
      description: "Update your marketplace listing with a simple and intuitive form"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Real-time Sync",
      description: "Changes are saved instantly and synced across all platforms"
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-inherit">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-blue-500 rounded-full border-3 border-t-transparent"
          />
          <p className="text-base font-medium text-gray-600 dark:text-gray-400">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-inherit">
        <Card className="max-w-2xl mx-auto shadow-lg">
          <div className="p-8 text-center">
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
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-inherit">
      <div className="px-4 py-6 mx-auto space-y-6 max-w-7xl sm:px-6 lg:px-8">
        {/* Toast Container */}
        <ToastContainer toasts={toasts} onClose={removeToast} />

        {/* Back Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => router.push(`/posts/${postId}`)}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Back to Post
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Eye className="w-4 h-4" />}
              onClick={() => window.open(`/posts/${postId}`, '_blank')}
              className="text-sm"
            >
              Preview
            </Button>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          >
            <h1 className="mb-3 text-4xl font-black tracking-tight text-transparent md:text-5xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontWeight: 900 }}>
              Edit Post
            </h1>
            <p className="text-base font-medium text-gray-600 dark:text-gray-400">
              Update your marketplace listing details
            </p>
          </motion.div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 gap-4 m-6 md:grid-cols-2"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="p-4 transition-all duration-300 border border-gray-200 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl dark:border-gray-700 hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 text-white bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Post Form with pre-filled data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <PostForm 
            onSuccess={handleSuccess}
            initialData={post}
            isEditMode={true}
            postId={postId}
          />
        </motion.div>
      </div>
    </div>
  );
}