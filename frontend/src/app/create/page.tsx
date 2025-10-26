'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import PostForm from '@/components/features/posts/PostForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { Sparkles, TrendingUp, Target } from 'lucide-react';

export default function CreatePostPage() {
  const router = useRouter();
  const { toasts, removeToast, success, error } = useToast();

  const handleSuccess = () => {
    success('Post created!', 'Your post has been created successfully.');
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  const features = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Easy Creation",
      description: "Simple and intuitive form to create your marketplace listing"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Schedule Posts",
      description: "Schedule your posts to be published at the perfect time"
    },
   
  ];

  return (
    <div className="min-h-screen bg-inherit">
      <div className="px-4 py-8 mx-auto space-y-8 max-w-7xl sm:px-6 lg:px-8">
        {/* Toast Container */}
        <ToastContainer toasts={toasts} onClose={removeToast} />

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
            <h1 className="mb-4 text-5xl font-black tracking-tight text-transparent md:text-7xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontWeight: 900 }}>
              Create New Post
            </h1>
            <p className="text-xl font-medium text-gray-600 dark:text-gray-400">
              Fill out the form below to create your marketplace listing
            </p>
          </motion.div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-6 m-10 h-18 heigrid-cols-1 md:grid-cols-2"
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

        {/* Post Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <PostForm onSuccess={handleSuccess} />
        </motion.div>
      </div>
    </div>
  );
}
