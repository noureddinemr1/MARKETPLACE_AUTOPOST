'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Calendar, DollarSign, MapPin, FileText, Image as ImageIcon, Tag, AlertCircle, Check, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import api from '@/services/api';
import { Post, PostUpdate, Category } from '@/types';

interface PostEditModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPost: Post) => void;
}

interface ValidationErrors {
  title?: string;
  description?: string;
  price?: string;
  category?: string;
  location?: string;
}

export const PostEditModal: React.FC<PostEditModalProps> = ({
  post,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    location: '',
    status: 'draft' as any,
    scheduled_at: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        description: post.description,
        price: post.price.toString(),
        category: post.category,
        location: post.location,
        status: post.status,
        scheduled_at: post.scheduled_at 
          ? new Date(post.scheduled_at).toISOString().slice(0, 16)
          : '',
      });
      setError('');
      setValidationErrors({});
    }
  }, [post]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters long';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    }

    if (formData.price) {
      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum < 0) {
        errors.price = 'Price must be a positive number';
      }
    }

    if (!formData.category) {
      errors.category = 'Please select a category';
    }

    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!post || !validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updateData: PostUpdate = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category as Category,
        location: formData.location.trim(),
        status: formData.status,
        scheduled_at: formData.scheduled_at 
          ? new Date(formData.scheduled_at).toISOString()
          : null,
      };

      const updatedPost = await api.updatePost(post.id, updateData);
      onSuccess(updatedPost);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const categories = [
    { value: 'vehicles', label: 'Vehicles', icon: '🚗' },
    { value: 'property-rentals', label: 'Property Rentals', icon: '🏠' },
    { value: 'apparel', label: 'Apparel', icon: '👕' },
    { value: 'electronics', label: 'Electronics', icon: '💻' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎮' },
    { value: 'family', label: 'Family', icon: '👨‍👩‍👧' },
    { value: 'garden-outdoor', label: 'Garden & Outdoor', icon: '🌻' },
    { value: 'hobbies', label: 'Hobbies', icon: '🎨' },
    { value: 'home-goods', label: 'Home Goods', icon: '🛋️' },
    { value: 'home-improvement-supplies', label: 'Home Improvement', icon: '🔨' },
    { value: 'home-sales', label: 'Home Sales', icon: '🏡' },
    { value: 'musical-instruments', label: 'Musical Instruments', icon: '🎸' },
    { value: 'office-supplies', label: 'Office Supplies', icon: '📎' },
    { value: 'pet-supplies', label: 'Pet Supplies', icon: '🐾' },
    { value: 'sporting-goods', label: 'Sporting Goods', icon: '⚽' },
    { value: 'toys-games', label: 'Toys & Games', icon: '🎲' },
    { value: 'other', label: 'Other', icon: '📦' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Edit Post" showCloseButton={true}>
      <div className="p-6 max-h-[70vh] overflow-y-auto">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-start gap-3 p-4 mb-6 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-xl"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-red-600 dark:text-red-400">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <FileText className="w-4 h-4" />
              Post Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                validationErrors.title 
                  ? 'border-red-500' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              placeholder="e.g., iPhone 13 Pro Max"
              maxLength={100}
            />
            {validationErrors.title && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <FileText className="w-4 h-4" />
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none ${
                validationErrors.description 
                  ? 'border-red-500' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              placeholder="Describe your item..."
              maxLength={2000}
            />
            {validationErrors.description && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.description}
              </p>
            )}
          </div>

          {/* Price & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <DollarSign className="w-4 h-4" />
                Price
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                  validationErrors.price 
                    ? 'border-red-500' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                placeholder="0.00"
                min="0"
              />
              {validationErrors.price && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.price}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Tag className="w-4 h-4" />
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none ${
                  validationErrors.category 
                    ? 'border-red-500' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
              {validationErrors.category && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.category}
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <MapPin className="w-4 h-4" />
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                validationErrors.location 
                  ? 'border-red-500' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              placeholder="e.g., New York, NY"
            />
            {validationErrors.location && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.location}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Scheduled At */}
          <div>
            <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <Calendar className="w-4 h-4" />
              Scheduled Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => handleInputChange('scheduled_at', e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Set a future date and time for scheduled posts. Leave empty for draft or published posts.
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Save Changes
                </span>
              )}
            </Button>
            
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default PostEditModal;
