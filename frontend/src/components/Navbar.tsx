/**
 * Modern Top Navigation Bar
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, Sun, Moon, User } from 'lucide-react';
import { Badge } from './ui/Badge';
import { useTheme } from '../contexts/ThemeContext';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme, mounted } = useTheme();
  const [notifications, setNotifications] = React.useState(3);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl dark:border-gray-800"
    >
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search posts, analytics..."
              className="w-full py-2 pl-10 pr-4 text-gray-900 transition-all bg-gray-100 border-0 dark:bg-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          {/* Theme Toggle */}
          {mounted && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </motion.button>
          )}

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-semibold">
                {notifications}
              </span>
            )}
          </motion.button>

          {/* Profile */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-2 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 sm:block">
              Profile
            </span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
