'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles } from 'lucide-react';
import PostList from '@/components/forms/PostList';
import { Button } from '@/components/ui/Button';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { Post } from '@/types';

export default function PostsPage() {
  const router = useRouter();
  const { toasts, removeToast, success } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEditPost = (post: Post) => {
    // The edit is now handled within PostList via modal
    success('Post updated', 'The post has been updated successfully.');
    setRefreshKey(prev => prev + 1);
  };

  const handleDeletePost = (postId: string) => {
    success('Post deleted', 'The post has been deleted successfully.');
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-inherit">
      <div className="px-4 py-8 mx-auto space-y-8 max-w-7xl sm:px-6 lg:px-8">
        {/* Toast Container */}
        <ToastContainer toasts={toasts} onClose={removeToast} />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3 mb-2"
              >
                <div className="p-3 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-black text-transparent md:text-5xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text">
                  All Posts
                </h1>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-600 dark:text-gray-400 ml-14"
              >
                Manage and organize your Facebook marketplace listings
              </motion.p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <Button
                variant="primary"
                size="lg"
                icon={<Plus className="w-5 h-5" />}
                onClick={() => router.push('/create')}
                className="shadow-xl hover:shadow-2xl"
              >
                Create New Post
              </Button>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute w-24 h-24 rounded-full -top-4 -right-4 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 blur-3xl -z-10" />
          <div className="absolute w-32 h-32 rounded-full -bottom-4 -left-4 bg-gradient-to-br from-teal-400/20 to-blue-400/20 blur-3xl -z-10" />
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          {[
            {
              title: "Quick Actions",
              description: "View, edit, or delete posts with one click",
              icon: "⚡",
              color: "from-blue-500 to-cyan-500"
            },
            {
              title: "Smart Filters",
              description: "Filter by category, status, or location",
              icon: "🔍",
              color: "from-purple-500 to-pink-500"
            },
            {
              title: "Real-time Updates",
              description: "Changes sync instantly across your listings",
              icon: "🔄",
              color: "from-green-500 to-emerald-500"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="relative p-4 transition-all duration-300 border border-gray-200 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl dark:border-gray-700 hover:shadow-lg group"
            >
              <div className="flex items-start gap-3">
                <div className={`text-2xl p-2 bg-gradient-to-br ${feature.color} rounded-xl`}>
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold text-gray-900 transition-colors dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
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

        {/* Post List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <PostList 
            key={refreshKey}
            onEditPost={handleEditPost} 
            onDeletePost={handleDeletePost} 
          />
        </motion.div>
      </div>
    </div>
  );
}
