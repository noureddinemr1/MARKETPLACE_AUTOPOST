/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Image optimization
  images: {
    domains: ['localhost', '127.0.0.1'],
    unoptimized: false, // Enable optimization for better performance
    formats: ['image/webp', 'image/avif'], // Modern formats for smaller file sizes
    minimumCacheTTL: 60, // Cache images for 1 minute
  },

  // Performance optimizations
  experimental: {
    scrollRestoration: true, // Restore scroll position on navigation
  },

  // Compression
  compress: true, // Enable gzip compression

  // Build optimizations
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Webpack optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Enable code splitting for better caching
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all';
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        mui: {
          test: /[\\/]node_modules[\\/]@mui[\\/]/,
          name: 'mui',
          chunks: 'all',
          priority: 10,
        },
      };
    }

    return config;
  },
};

module.exports = nextConfig;