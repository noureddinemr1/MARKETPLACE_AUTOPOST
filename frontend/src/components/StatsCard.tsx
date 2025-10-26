/**
 * Modern Stats Card Component with animations
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card } from './ui/Card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  index?: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  index = 0,
}) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card variant="default" className="hover:shadow-2xl transition-all duration-300">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {value}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={cn(
                    'text-sm font-semibold',
                    isPositive && 'text-emerald-600 dark:text-emerald-400',
                    isNegative && 'text-red-600 dark:text-red-400',
                    !isPositive && !isNegative && 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  {isPositive && '↑'}
                  {isNegative && '↓'}
                  {Math.abs(change)}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  vs last month
                </span>
              </div>
            )}
          </div>
          <div
            className={cn(
              'p-3 rounded-xl',
              iconBg
            )}
          >
            <Icon className={cn('w-6 h-6', iconColor)} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default StatsCard;
