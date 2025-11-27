import React, { useState, useEffect, useCallback } from 'react';
import { Edit, X, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import debounce from 'debounce';

export interface PostFormData {
  title: string;
  subtitle: string;
  message: string;
  tags: string[];
}

export interface PostFormProps {
  data: PostFormData;
  onDataChange: (data: PostFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  title?: string;
  description?: string;
  showTagsSection?: boolean;
  suggestedTags?: string[];
}

const PostForm: React.FC<PostFormProps> = ({
  data,
  onDataChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Update Post",
  title = "Edit Post",
  description = "Update your post content and settings",
  showTagsSection = true,
  suggestedTags = [
    "BoookBox", "FoodSharing", "Community", "Meals", "Restaurant", 
    "Giving", "Kindness", "FoodForAll", "Support", "Local", "Charity"
  ]
}) => {
  // State for tag input
  const [tagInput, setTagInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedInput, setDebouncedInput] = useState('');

  const handleFieldChange = useCallback((field: keyof PostFormData, value: string | string[]) => {
    onDataChange({
      ...data,
      [field]: value
    });
  }, [data, onDataChange]);

  const handleTagRemoval = (indexToRemove: number) => {
    const updatedTags = data.tags.filter((_, index) => index !== indexToRemove);
    handleFieldChange('tags', updatedTags);
  };

  // Create debounced function for updating suggestions
  const updateSuggestions = useCallback((input: string) => {
    setDebouncedInput(input);
    setShowSuggestions(input.length > 0);
  }, []);

  const debouncedUpdateSuggestions = React.useMemo(
    () => debounce(updateSuggestions, 300),
    [updateSuggestions]
  );

  // Effect to trigger debounced suggestions update
  useEffect(() => {
    debouncedUpdateSuggestions(tagInput);
    return () => {
      // Cleanup function for debounce
      if (typeof debouncedUpdateSuggestions.clear === 'function') {
        debouncedUpdateSuggestions.clear();
      }
    };
  }, [tagInput, debouncedUpdateSuggestions]);

  // Handle tag input changes
  const handleTagInputChange = (value: string) => {
    setTagInput(value);
    // Debounced function will handle showing suggestions
  };

  // Handle adding tag from input or suggestion
  const handleAddTag = (tag?: string) => {
    const tagToAdd = tag || tagInput.trim();
    if (tagToAdd && !data.tags.includes(tagToAdd)) {
      const newTags = [...data.tags, tagToAdd];
      handleFieldChange('tags', newTags);
      setTagInput('');
      setShowSuggestions(false);
    }
  };

  // Handle Enter key press
  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Filter suggested tags based on debounced input and existing tags
  const filteredSuggestions = suggestedTags.filter(tag => 
    !data.tags.includes(tag) && 
    tag.toLowerCase().includes(debouncedInput.toLowerCase())
  );

  const isFormValid = data.title.trim() && data.message.trim();

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white rounded-t-lg">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Edit className="w-5 h-5 text-primary" />
          {title}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {description}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-6">
          {/* Post Content Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Post Content
            </h3>
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="Enter a compelling title for your post..."
                maxLength={200}
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">
                  This will be the main headline of your post
                </p>
                <span className="text-xs text-gray-400">
                  {data.title.length}/200
                </span>
              </div>
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtitle
              </label>
              <input
                type="text"
                value={data.subtitle}
                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="Add a subtitle to provide more context..."
                maxLength={150}
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">
                  Optional subtitle to complement your title
                </p>
                <span className="text-xs text-gray-400">
                  {data.subtitle.length}/150
                </span>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={data.message}
                onChange={(e) => handleFieldChange('message', e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-colors"
                placeholder="Share your thoughts, experience, or story..."
                maxLength={2000}
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">
                  Tell your community about your experience
                </p>
                <span className="text-xs text-gray-400">
                  {data.message.length}/2000
                </span>
              </div>
            </div>
          </div>

          {/* Tags Section */}
          {showTagsSection && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Tags & Categories
              </h3>
              
              {/* Current Tags Display */}
              {data.tags.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full border border-primary/20"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleTagRemoval(index)}
                          className="ml-1 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags Input */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Tags
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => handleTagInputChange(e.target.value)}
                    onKeyDown={handleTagInputKeyPress}
                    onFocus={() => setShowSuggestions(debouncedInput.length > 0 || tagInput.length > 0)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="Type to add a tag..."
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag()}
                    disabled={!tagInput.trim() || data.tags.includes(tagInput.trim())}
                    className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {/* Add */}
                  </button>
                </div>

                {/* Tag Suggestions Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    <div className="p-2">
                      <p className="text-xs text-gray-500 mb-2 px-2">Suggested tags:</p>
                      <div className="space-y-1">
                        {filteredSuggestions.slice(0, 8).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleAddTag(tag)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-between"
                          >
                            <span>#{tag}</span>
                            <Plus className="w-3 h-3 text-gray-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-1">
                  Type and press Enter to add tags, or select from suggestions
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Required fields are marked with *
            </span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              onClick={onSubmit}
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {submitLabel}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostForm;