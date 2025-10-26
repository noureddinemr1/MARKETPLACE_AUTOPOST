/**
 * Modern Input component with validation support
 */
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  animated?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      animated = true,
      ...props
    },
    ref
  ) => {
    const inputClasses = cn(
      'w-full px-4 py-2.5 bg-white dark:bg-gray-900 border rounded-xl transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      'placeholder:text-gray-400 dark:placeholder:text-gray-500',
      error
        ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
        : 'border-gray-300 dark:border-gray-700',
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      className
    );

    const Container = animated ? motion.div : 'div';

    return (
      <Container
        className="space-y-2"
        {...(animated && {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.2 },
        })}
      >
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}

          <input ref={ref} className={inputClasses} {...props} />

          {(rightIcon || error) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {error ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <span className="text-gray-400">{rightIcon}</span>
              )}
            </div>
          )}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
          >
            {error}
          </motion.p>
        )}

        {helperText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </Container>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export default Input;
