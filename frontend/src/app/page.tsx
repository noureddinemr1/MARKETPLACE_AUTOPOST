'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  PlusCircle,
  Facebook,
  BarChart3,
  Zap,
  AlertCircle,
  FileText,
  Archive,
  Image as ImageIcon,
  DollarSign,
  Loader2,
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast, ToastContainer } from '../components/ui/Toast';
import api from '../services/api';
import type { DashboardStats, RecentActivity } from '../types';

export default function HomePage() {
  const router = useRouter();
  const { toasts, removeToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats and activities in parallel
      const [statsData, activitiesData] = await Promise.all([
        api.getDashboardStats(),
        api.getRecentActivity(10),
      ]);

      setStats(statsData);
      setActivities(activitiesData);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="success">Published</Badge>;
      case 'pending':
        return <Badge variant="warning">Scheduled</Badge>;
      case 'draft':
        return <Badge variant="default">Draft</Badge>;
      case 'archived':
        return <Badge variant="default">Archived</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'draft':
        return <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
      case 'archived':
        return <Archive className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
      default:
        return <Zap className="w-5 h-5 text-red-600 dark:text-red-400" />;
    }
  };

  const getActivityBgColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-100 dark:bg-emerald-900/30';
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-900/30';
      case 'draft':
        return 'bg-gray-100 dark:bg-gray-900/30';
      case 'archived':
        return 'bg-gray-100 dark:bg-gray-900/30';
      default:
        return 'bg-red-100 dark:bg-red-900/30';
    }
  };

  return (
    <div className="space-y-6 bg-inherit">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="text-5xl font-black tracking-tight text-transparent md:text-6xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text" 
            style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontWeight: 900 }}
          >
            Dashboard
          </motion.h1>
          <p className="mt-2 text-lg font-medium text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with your posts today.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<PlusCircle className="w-5 h-5" />}
          onClick={() => router.push('/create')}
        >
          Create Post
        </Button>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="font-medium text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-700 dark:text-red-400">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={fetchDashboardData}
              >
                Try Again
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Dashboard Content */}
      {!loading && !error && stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Posts"
              value={stats.total_posts.toString()}
              icon={Facebook}
              iconColor="text-blue-600"
              iconBg="bg-blue-100 dark:bg-blue-900/30"
              index={0}
            />
            <StatsCard
              title="Published"
              value={stats.published_posts.toString()}
              icon={CheckCircle}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              index={1}
            />
            <StatsCard
              title="Scheduled"
              value={stats.scheduled_posts.toString()}
              icon={Calendar}
              iconColor="text-amber-600"
              iconBg="bg-amber-100 dark:bg-amber-900/30"
              index={2}
            />
            <StatsCard
              title="Drafts"
              value={stats.draft_posts.toString()}
              icon={FileText}
              iconColor="text-gray-600"
              iconBg="bg-gray-100 dark:bg-gray-900/30"
              index={3}
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Card variant="default">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl dark:bg-purple-900/30">
                    <ImageIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.total_images}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Images</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="default">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-xl dark:bg-green-900/30">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${stats.average_price.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Average Price</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="default">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-cyan-100 dark:bg-cyan-900/30">
                    <TrendingUp className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.facebook_posted_count}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Facebook Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card variant="default">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates from your automated posts</CardDescription>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="w-12 h-12 mb-3 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No recent activity yet. Create your first post to get started!
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        className="mt-4"
                        onClick={() => router.push('/create')}
                      >
                        Create Post
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="flex items-center justify-between p-4 transition-all duration-200 border border-gray-100 cursor-pointer rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:border-gray-800"
                          onClick={() => router.push(`/posts/${activity.id}`)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityBgColor(activity.status)}`}>
                              {getActivityIcon(activity.status)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {activity.post_title}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {activity.action} · {activity.time}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(activity.status)}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Quick Actions with Gradient */}
              <Card variant="gradient" className="text-white border-0 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                  <CardDescription className="text-white/80">Manage your posts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="justify-start w-full"
                      icon={<PlusCircle className="w-4 h-4" />}
                      onClick={() => router.push('/create')}
                    >
                      Create New Post
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="justify-start w-full"
                      icon={<Calendar className="w-4 h-4" />}
                      onClick={() => router.push('/posts?status=scheduled')}
                    >
                      View Scheduled
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="justify-start w-full"
                      icon={<FileText className="w-4 h-4" />}
                      onClick={() => router.push('/posts?status=draft')}
                    >
                      View Drafts
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Pro Tip */}
             
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}