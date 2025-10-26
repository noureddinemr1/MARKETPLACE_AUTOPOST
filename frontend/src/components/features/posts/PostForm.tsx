'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Calendar, DollarSign, MapPin, FileText, Image as ImageIcon, Tag, AlertCircle, Check, Sparkles } from 'lucide-react';
import api from '../../../services/api';
import { PostCreate, PostUpdate, Category, Post } from '../../../types';
import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';

interface PostFormProps {
  onSuccess: () => void;
  initialData?: Post | null;
  isEditMode?: boolean;
  postId?: string;
}

interface ValidationErrors {
  title?: string;
  content?: string;
  price?: string;
  category?: string;
  location?: string;
  scheduled_time?: string;
  images?: string;
}

export default function PostForm({ onSuccess, initialData = null, isEditMode = false, postId }: PostFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.description || '',
    price: initialData?.price?.toString() || '',
    category: initialData?.category || '',
    location: initialData?.location || '',
    scheduled_time: initialData?.scheduled_at ? new Date(initialData.scheduled_at).toISOString().slice(0, 16) : '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(initialData?.images?.map(img => img.filename) || []);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        content: initialData.description,
        price: initialData.price.toString(),
        category: initialData.category,
        location: initialData.location,
        scheduled_time: initialData.scheduled_at ? new Date(initialData.scheduled_at).toISOString().slice(0, 16) : '',
      });
      setExistingImages(initialData.images?.map(img => img.filename) || []);
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters long';
    } else if (formData.title.trim().length > 100) {
      errors.title = 'Title must be less than 100 characters';
    }

    // Content validation
    if (!formData.content.trim()) {
      errors.content = 'Description is required';
    } else if (formData.content.trim().length < 10) {
      errors.content = 'Description must be at least 10 characters long';
    } else if (formData.content.trim().length > 2000) {
      errors.content = 'Description must be less than 2000 characters';
    }

    // Price validation
    if (formData.price) {
      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum < 0) {
        errors.price = 'Price must be a positive number';
      } else if (priceNum > 999999.99) {
        errors.price = 'Price cannot exceed $999,999.99';
      }
    }

    // Category validation
    if (!formData.category) {
      errors.category = 'Please select a category';
    }

    // Location validation
    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    } else if (formData.location.trim().length < 3) {
      errors.location = 'Location must be at least 3 characters long';
    }

    // Scheduled time validation
    if (formData.scheduled_time) {
      const scheduledDate = new Date(formData.scheduled_time);
      const now = new Date();
      if (scheduledDate <= now) {
        errors.scheduled_time = 'Scheduled time must be in the future';
      }
    }

    // Image validation
    if (files.length > 0) {
      const maxSize = 5 * 1024 * 1024; // 5MB per image
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

      for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
          errors.images = 'Only JPEG, PNG, GIF, and WebP images are allowed';
          break;
        }
        if (file.size > maxSize) {
          errors.images = 'Each image must be less than 5MB';
          break;
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, saveAsDraft: boolean = false) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEditMode && postId) {
        // Update existing post
        const updateData: PostUpdate = {
          title: formData.title.trim(),
          description: formData.content.trim(),
          price: formData.price ? parseFloat(formData.price) : 0,
          category: formData.category as Category,
          location: formData.location.trim(),
          status: saveAsDraft ? 'draft' : (formData.scheduled_time ? 'scheduled' : initialData?.status || 'published'),
          scheduled_at: formData.scheduled_time ? new Date(formData.scheduled_time).toISOString() : null,
        };

        await api.updatePost(postId, updateData);

        // Handle image deletions
        for (const filename of imagesToDelete) {
          await api.removeImage(postId, filename);
        }

        // Upload new images
        if (files.length > 0) {
          await api.uploadImages(postId, files);
        }
      } else {
        // Create new post
        let status: 'draft' | 'published' | 'scheduled' = 'published';
        let scheduled_at: string | null = null;

        if (saveAsDraft) {
          status = 'draft';
        } else if (formData.scheduled_time) {
          status = 'scheduled';
          scheduled_at = new Date(formData.scheduled_time).toISOString();
        }

        const postData: PostCreate = {
          title: formData.title.trim(),
          description: formData.content.trim(),
          price: formData.price ? parseFloat(formData.price) : 0,
          category: formData.category as Category,
          location: formData.location.trim(),
          status: status,
          scheduled_at: scheduled_at,
        };

        const response = await api.createPost(postData);

        // Upload images if any
        if (files.length > 0 && response.id) {
          await api.uploadImages(response.id, files);
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'create'} post`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length > 5) {
      setValidationErrors({ images: 'Maximum 5 images allowed' });
      return;
    }

    // Clear any previous image validation errors
    setValidationErrors(prev => ({ ...prev, images: undefined }));
    setFiles(selectedFiles);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto"
    >
      <Card className="overflow-hidden border-0 shadow-xl">
        

        <CardContent className="p-8">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="flex items-start gap-3 p-4 mb-6 border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 dark:border-red-800 rounded-2xl"
              >
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-700 dark:text-red-400">{error}</p>
                </div>
                <button onClick={() => setError('')} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                Post Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-4 py-4 bg-white dark:bg-gray-900 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 ${
                    validationErrors.title 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-200 dark:border-gray-700 focus:border-blue-500'
                  }`}
                  placeholder="e.g., iPhone 13 Pro Max - Like New Condition"
                  maxLength={100}
                />
                <div className="absolute text-xs text-gray-400 right-4 top-4">
                  {formData.title.length}/100
                </div>
              </div>
              <AnimatePresence>
                {validationErrors.title && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-red-500 text-sm mt-2 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.title}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                Description <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  rows={6}
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  className={`w-full px-4 py-4 bg-white dark:bg-gray-900 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all resize-none text-gray-900 dark:text-gray-100 placeholder-gray-400 ${
                    validationErrors.content 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-200 dark:border-gray-700 focus:border-purple-500'
                  }`}
                  placeholder="Describe your item in detail... Include condition, features, and any important information."
                  maxLength={2000}
                />
                <div className="absolute text-xs text-gray-400 right-4 bottom-4">
                  {formData.content.length}/2000
                </div>
              </div>
              <AnimatePresence>
                {validationErrors.content && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-red-500 text-sm mt-2 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.content}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Price & Category Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  Price
                </label>
                <div className="relative">
                  <DollarSign className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className={`w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/20 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 ${
                      validationErrors.price 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 dark:border-gray-700 focus:border-green-500'
                    }`}
                    placeholder="0.00"
                    min="0"
                    max="999999.99"
                  />
                </div>
                <AnimatePresence>
                  {validationErrors.price && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-red-500 text-sm mt-2 flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.price}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <div className="p-1.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                    <Tag className="w-4 h-4 text-white" />
                  </div>
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`w-full px-4 py-4 bg-white dark:bg-gray-900 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 transition-all text-gray-900 dark:text-gray-100 appearance-none cursor-pointer ${
                      validationErrors.category 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 dark:border-gray-700 focus:border-orange-500'
                    }`}
                  >
                    <option value="">Select a category...</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute -translate-y-1/2 pointer-events-none right-4 top-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <AnimatePresence>
                  {validationErrors.category && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-red-500 text-sm mt-2 flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.category}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Location */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <div className="p-1.5 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/20 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 ${
                    validationErrors.location 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-200 dark:border-gray-700 focus:border-teal-500'
                  }`}
                  placeholder="e.g., New York, NY"
                />
              </div>
              <AnimatePresence>
                {validationErrors.location && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-red-500 text-sm mt-2 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.location}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Scheduled Time */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="p-6 border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl dark:border-blue-800"
            >
              <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                Schedule for Later (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_time}
                onChange={(e) => handleInputChange('scheduled_time', e.target.value)}
                className={`w-full px-4 py-4 bg-white dark:bg-gray-900 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all text-gray-900 dark:text-gray-100 ${
                  validationErrors.scheduled_time 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500'
                }`}
                min={new Date().toISOString().slice(0, 16)}
              />
              <AnimatePresence>
                {validationErrors.scheduled_time && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-red-500 text-sm mt-2 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.scheduled_time}
                  </motion.p>
                )}
              </AnimatePresence>
              <p className="flex items-start gap-2 mt-3 text-sm text-blue-600 dark:text-blue-400">
                <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Leave empty to publish immediately, or schedule your post to be published at a specific time</span>
              </p>
            </motion.div>

            {/* Images */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <div className="p-1.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg">
                  <ImageIcon className="w-4 h-4 text-white" />
                </div>
                Images <span className="text-xs text-gray-500">(Max 5 images, 5MB each)</span>
              </label>

              {/* Existing Images (Edit Mode) */}
              {isEditMode && initialData?.images && initialData.images.length > 0 && (
                <div className="mb-4">
                  <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Current Images</p>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                    {initialData.images.map((image, index) => {
                      const isMarkedForDeletion = imagesToDelete.includes(image.filename);
                      return (
                        <motion.div
                          key={index}
                          className={`relative group ${isMarkedForDeletion ? 'opacity-50' : ''}`}
                        >
                          <div className="overflow-hidden bg-gray-100 border-2 border-gray-200 rounded-xl aspect-square dark:bg-gray-800 dark:border-gray-700">
                            <img
                              src={image.url}
                              alt={`Image ${index + 1}`}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          {isMarkedForDeletion ? (
                            <button
                              type="button"
                              onClick={() => setImagesToDelete(imagesToDelete.filter(f => f !== image.filename))}
                              className="absolute p-1.5 text-white transition-all bg-blue-500 rounded-full shadow-lg -top-2 -right-2 hover:bg-blue-600"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setImagesToDelete([...imagesToDelete, image.filename])}
                              className="absolute p-1.5 text-white transition-all bg-red-500 rounded-full shadow-lg opacity-0 -top-2 -right-2 hover:bg-red-600 group-hover:opacity-100"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* File Upload Area */}
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`group flex flex-col items-center justify-center gap-3 w-full px-6 py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-2 border-dashed rounded-2xl cursor-pointer hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 ${
                    validationErrors.images 
                      ? 'border-red-500' 
                      : 'border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <div className="p-4 transition-all duration-300 bg-white shadow-lg dark:bg-gray-800 rounded-2xl group-hover:shadow-xl group-hover:scale-110">
                    <Upload className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="text-center">
                    <p className="mb-1 text-base font-semibold text-gray-700 dark:text-gray-300">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      JPEG, PNG, GIF, WebP • Max 5MB per file
                    </p>
                  </div>
                </label>
              </div>
              <AnimatePresence>
                {validationErrors.images && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-red-500 text-sm mt-2 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.images}
                  </motion.p>
                )}
              </AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 gap-3 mt-4 md:grid-cols-3 lg:grid-cols-5"
                >
                  {files.map((file, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative group"
                    >
                      <div className="flex flex-col items-center justify-center p-3 overflow-hidden border-2 border-blue-200 aspect-square bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 dark:border-blue-800 rounded-2xl">
                        <ImageIcon className="w-8 h-8 mb-2 text-blue-500" />
                        <p className="text-xs font-medium text-center text-gray-700 dark:text-gray-300 line-clamp-2">
                          {file.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transform hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>

            {/* Submit Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col gap-4 pt-6 border-t border-gray-200 sm:flex-row dark:border-gray-700"
            >
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                onClick={(e) => handleSubmit(e, false)}
                className="flex-1 py-4 text-base font-semibold shadow-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-600/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEditMode ? 'Saving...' : 'Creating...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    {isEditMode ? 'Save Changes' : (formData.scheduled_time ? 'Schedule Post' : 'Publish Now')}
                  </span>
                )}
              </Button>
              
              {!isEditMode && (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={(e) => handleSubmit(e as any, true)}
                  disabled={loading}
                  className="px-8 py-4 text-base font-semibold sm:w-auto"
                >
                  Save as Draft
                </Button>
              )}
              
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={onSuccess}
                disabled={loading}
                className="px-8 py-4 text-base font-semibold sm:w-auto"
              >
                Cancel
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}