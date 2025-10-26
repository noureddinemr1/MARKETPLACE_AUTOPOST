'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Card } from '@/components/ui';
import apiService from '@/services/api';
import { 
  TrendingUp, 
  DollarSign, 
  MapPin, 
  Package, 
  Activity,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';

// Chart colors
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  }
};

interface OverviewStats {
  total_posts: number;
  published: number;
  scheduled: number;
  drafts: number;
  archived: number;
  facebook_posted: number;
  pending_facebook: number;
  success_rate: number;
  total_images: number;
  average_price: number;
}

interface PostOverTime {
  date: string;
  count: number;
}

interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

interface LocationData {
  location: string;
  count: number;
  percentage: number;
}

interface ActivityData {
  date: string;
  day: string;
  created: number;
  updated: number;
  total: number;
}

interface PriceDistribution {
  min: number;
  max: number;
  average: number;
  median: number;
  ranges: Array<{ range: string; count: number }>;
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [postsOverTime, setPostsOverTime] = useState<PostOverTime[]>([]);
  const [categoryDist, setCategoryDist] = useState<CategoryDistribution[]>([]);
  const [statusDist, setStatusDist] = useState<StatusDistribution[]>([]);
  const [priceDist, setPriceDist] = useState<PriceDistribution | null>(null);
  const [locationDist, setLocationDist] = useState<LocationData[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityData[]>([]);

  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        overviewData,
        postsData,
        categoryData,
        statusData,
        priceData,
        locationData,
        activityData
      ] = await Promise.all([
        apiService.getAnalyticsOverview(),
        apiService.getPostsOverTime(timeRange),
        apiService.getAnalyticsCategoryDistribution(),
        apiService.getAnalyticsStatusDistribution(),
        apiService.getPriceDistribution(),
        apiService.getLocationDistribution(),
        apiService.getAnalyticsRecentActivity(7)
      ]);

      setOverview(overviewData);
      setPostsOverTime(postsData);
      setCategoryDist(categoryData);
      setStatusDist(statusData);
      setPriceDist(priceData);
      setLocationDist(locationData);
      setRecentActivity(activityData);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      setError(error?.response?.data?.detail || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color }: any) => (
    <motion.div variants={itemVariants}>
      <Card className="p-6 transition-shadow hover:shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-inherit">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-inherit">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full dark:bg-red-900/20">
            <Activity className="w-8 h-8 text-red-600" />
          </div>
          <p className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Failed to Load Analytics</p>
          <p className="mb-4 text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={loadAnalyticsData}
            className="px-6 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-inherit">
      <div className="px-4 py-8 mx-auto space-y-8 max-w-7xl sm:px-6 lg:px-8">
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
            className="flex items-center justify-center mb-4"
          >
            <h1 className="text-5xl font-black tracking-tight text-transparent md:text-7xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontWeight: 900 }}>
              Analytics Dashboard
            </h1>
          </motion.div>
          <p className="text-xl font-medium text-gray-600 dark:text-gray-400">
            Comprehensive insights into your posting performance
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            icon={Package}
            title="Total Posts"
            value={overview?.total_posts || 0}
            color="bg-blue-500"
          />
          <StatCard
            icon={Activity}
            title="Published Posts"
            value={overview?.published || 0}
            subtitle={`${overview?.scheduled || 0} scheduled`}
            color="bg-green-500"
          />
          <StatCard
            icon={DollarSign}
            title="Average Price"
            value={`$${(overview?.average_price || 0).toFixed(2)}`}
            subtitle={`${overview?.total_images || 0} images`}
            color="bg-amber-500"
          />
          <StatCard
            icon={TrendingUp}
            title="Draft Posts"
            value={overview?.drafts || 0}
            subtitle={`${overview?.success_rate || 0}% success rate`}
            color="bg-purple-500"
          />
        </motion.div>

        {/* Charts Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          {/* Posts Over Time */}
          <motion.div variants={itemVariants}>
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Posts Over Time
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={postsOverTime}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Category Distribution */}
          <motion.div variants={itemVariants}>
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <PieChartIcon className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Category Distribution
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryDist as any}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.category}: ${entry.percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="category"
                  >
                    {categoryDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Status Distribution */}
          <motion.div variants={itemVariants}>
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Status Distribution
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis 
                    dataKey="status" 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Top Locations */}
          <motion.div variants={itemVariants}>
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-red-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Top Locations
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={locationDist} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis 
                    type="number" 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="location" 
                    stroke="#9ca3af"
                    width={100}
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="count" fill="#ef4444" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </motion.div>

        {/* Recent Activity Timeline */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Activity (Last 7 Days)
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={recentActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis 
                  dataKey="day" 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Created"
                />
                <Line
                  type="monotone"
                  dataKey="updated"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Updated"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Price Distribution Stats */}
        {priceDist && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="w-5 h-5 text-amber-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Price Distribution
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Price</p>
                  <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${priceDist.average?.toFixed(2) || 0}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Min Price</p>
                  <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                    ${priceDist.min?.toFixed(2) || 0}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Max Price</p>
                  <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
                    ${priceDist.max?.toFixed(2) || 0}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Median Price</p>
                  <p className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ${priceDist.median?.toFixed(2) || 0}
                  </p>
                </div>
              </div>
              {priceDist.ranges && priceDist.ranges.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Price Ranges
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={priceDist.ranges}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis 
                        dataKey="range" 
                        stroke="#9ca3af"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#9ca3af"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
