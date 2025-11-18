import React, { useState, useEffect, useRef } from 'react';
import { generatePostFromPrompt, suggestTagsForPost } from '../services/geminiService';
import type { Post } from '../types';
import { POST_CATEGORIES } from '../constants';
import { CloseIcon, SparklesIcon, PaperClipIcon, TrashIcon, LightBulbIcon } from './IconComponents';

interface CreatePostModalProps {
  onClose: () => void;
  onSubmit: (postData: Omit<Post, 'id' | 'author' | 'createdAt'>, postId?: string) => void;
  postToEdit?: Post | null;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onSubmit, postToEdit }) => {
  const isEditMode = !!postToEdit;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [budget, setBudget] = useState<number | undefined>(undefined);
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<{ title: string; description: string; tags: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);

  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const suggestionTimeoutRef = useRef<number | null>(null);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(true);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title);
      setDescription(postToEdit.description);
      setCategory(postToEdit.category);
      setTags(postToEdit.tags.join(', '));
      setBudget(postToEdit.budget);
      if (postToEdit.mediaUrl) {
        setMediaPreviewUrl(postToEdit.mediaUrl);
      }
    } else {
        setCategory(POST_CATEGORIES[0]);
    }
  }, [postToEdit]);

  useEffect(() => {
    // Debounce AI suggestions for tags
    if (isEditMode || (!title.trim() && !description.trim())) {
      setSuggestedTags([]);
      return;
    }

    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }
    
    // Only show loading if there's substantial text
    if (title.length > 5 || description.length > 20) {
      setIsSuggestingTags(true);
    }

    suggestionTimeoutRef.current = window.setTimeout(async () => {
      if (!title.trim() && !description.trim()) {
        setIsSuggestingTags(false);
        return;
      }
      try {
        const suggestions = await suggestTagsForPost(title, description);
        if (suggestions) {
          setSuggestedTags(suggestions);
        }
      } catch (e) {
        console.error("Failed to fetch tag suggestions", e);
      } finally {
        setIsSuggestingTags(false);
      }
    }, 1000); // 1-second debounce

    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, [title, description, isEditMode]);

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedPost(null);
    try {
        const result = await generatePostFromPrompt(aiPrompt);
        if (result) {
            setGeneratedPost(result);
        } else {
            setError('The AI could not generate content for this prompt.');
        }
    } catch (err) {
        setError('Failed to get AI suggestions. Please try again.');
        console.error(err);
    } finally {
        setIsGenerating(false);
    }
  };
  
  const applyAIGeneratedContent = () => {
    if (!generatedPost) return;
    setTitle(generatedPost.title);
    setDescription(generatedPost.description);
    setTags(generatedPost.tags.join(', '));
    setGeneratedPost(null);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setMediaFile(file);
        if (mediaPreviewUrl && mediaPreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(mediaPreviewUrl);
        }
        setMediaPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveMedia = () => {
    if (mediaPreviewUrl && mediaPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaPreviewUrl);
    }
    setMediaFile(null);
    setMediaPreviewUrl(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  };

  const handleAddTag = (tagToAdd: string) => {
    const currentTags = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    if (!currentTags.includes(tagToAdd.toLowerCase())) {
        setTags(prevTags => prevTags ? `${prevTags}, ${tagToAdd}` : tagToAdd);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Frontend validation
    if (!title || !description || !category) {
      setError('Please fill in all required fields (title, description, and category)');
      return;
    }

    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long');
      return;
    }

    if (title.trim().length > 200) {
      setError('Title must be no more than 200 characters long');
      return;
    }

    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }

    if (description.trim().length > 5000) {
      setError('Description must be no more than 5000 characters long');
      return;
    }

    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    if (tagsArray.length > 10) {
      setError('Maximum 10 tags allowed');
      return;
    }

    // Clear any previous errors
    setError(null);

    let mediaUrl: string | undefined = undefined;
    let mediaType: Post['mediaType'] = undefined;

    if (mediaFile) { // A new file has been selected
      mediaUrl = mediaPreviewUrl || undefined;
      mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
    } else if (mediaPreviewUrl) { // No new file, but a preview (old media) exists
      mediaUrl = postToEdit?.mediaUrl;
      mediaType = postToEdit?.mediaType;
    } // If mediaPreviewUrl is null, both mediaUrl and mediaType will be undefined, effectively removing the media.

    const postData = {
      title: title.trim(),
      description: description.trim(),
      category,
      tags: tagsArray,
      budget: budget,
      mediaUrl,
      mediaType,
    };

    onSubmit(postData, postToEdit?.id);
  };

  return (
    <div className={`fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{isEditMode ? 'Edit Your Post' : 'Create a New Post'}</h2>
          <button onClick={handleClose} className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
          {!isEditMode && (
            <>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <h4 className="flex items-center font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                    <SparklesIcon className="w-5 h-5 mr-2 text-indigo-600"/>
                    Need help writing your post?
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">Describe your idea, and AI will draft a title, description, and tags for you.</p>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white dark:placeholder-zinc-400"
                  placeholder="e.g., I want to build a mobile app for a local charity"
                />
                <button
                  type="button"
                  onClick={handleGenerateWithAI}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-indigo-400 dark:disabled:bg-indigo-800"
                >
                  {isGenerating ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>
              
              <div className="h-fit transition-all duration-300">
                {isGenerating && (
                  <div className="text-center p-4">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">AI is crafting your post...</p>
                  </div>
                )}
                {error && <p className="text-sm text-red-600 p-4 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">{error}</p>}
                {generatedPost && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-3">AI-Generated Draft</h4>
                    <div className="space-y-3 bg-white dark:bg-zinc-800 p-4 rounded-md shadow-sm">
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">{generatedPost.title}</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 border-l-4 border-indigo-200 dark:border-indigo-600 pl-3">{generatedPost.description}</p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {generatedPost.tags.map(tag => (
                              <span key={tag} className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>
                          ))}
                        </div>
                    </div>
                    <button
                      type="button"
                      onClick={applyAIGeneratedContent}
                      className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    >
                        Use This Draft
                    </button>
                  </div>
                )}
              </div>
              
              <hr className="border-zinc-200 dark:border-zinc-700" />
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white dark:placeholder-zinc-400"
                placeholder="e.g., Need help with a Python script"
                required
              />
            </div>
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
                <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
                    required
                >
                    {POST_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white dark:placeholder-zinc-400"
              placeholder="Describe your problem or the skill you need. Be as detailed as possible."
              required
            ></textarea>
          </div>
          
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tags</label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white dark:placeholder-zinc-400"
              placeholder="e.g., react, python, design (comma-separated)"
            />
             {!isEditMode && (
                <div className="mt-3">
                    <div className="flex items-center text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                        <LightBulbIcon className="w-5 h-5 mr-2 text-yellow-500" />
                        <span>AI Suggestions</span>
                        {isSuggestingTags && <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">Loading...</span>}
                    </div>
                    {suggestedTags.length > 0 && !isSuggestingTags && (
                        <div className="flex flex-wrap gap-2">
                            {suggestedTags.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleAddTag(tag)}
                                    className="bg-zinc-100 text-zinc-700 text-xs font-medium px-2.5 py-1 rounded-full hover:bg-zinc-200 transition-colors dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                                >
                                    + {tag}
                                </button>
                            ))}
                        </div>
                    )}
                    {!isSuggestingTags && suggestedTags.length === 0 && (title.length > 5 || description.length > 20) && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">Keep typing for tag suggestions.</p>
                    )}
                </div>
            )}
          </div>
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Budget (Optional)</label>
            <input
              type="number"
              id="budget"
              value={budget === undefined ? '' : budget}
              onChange={(e) => setBudget(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white dark:placeholder-zinc-400"
              placeholder="e.g., 500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Attach Media (Optional)</label>
            {!mediaPreviewUrl ? (
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-300 dark:border-zinc-600 border-dashed rounded-md hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
                <div className="space-y-1 text-center">
                  <PaperClipIcon className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" />
                  <div className="flex text-sm text-zinc-600 dark:text-zinc-400">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-zinc-800 rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 dark:text-indigo-400 dark:focus-within:ring-offset-zinc-800">
                      <span>Click to upload media</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleMediaChange} accept="image/*,video/*" />
                    </label>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">Image or Video</p>
                </div>
              </div>
            ) : (
              <div className="mt-2 p-2 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg">
                <div className="relative">
                    {mediaFile?.type.startsWith('image/') || (mediaPreviewUrl && !mediaPreviewUrl.startsWith('blob:') && postToEdit?.mediaType === 'image') ? (
                    <img src={mediaPreviewUrl} alt="Preview" className="w-full rounded-lg max-h-60 object-cover border border-zinc-200 dark:border-zinc-700" />
                    ) : (
                    <video src={mediaPreviewUrl} controls className="w-full rounded-lg max-h-60 border border-zinc-200 dark:border-zinc-700" />
                    )}
                    <button
                    type="button"
                    onClick={handleRemoveMedia}
                    className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1.5 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white"
                    aria-label="Remove media"
                    >
                    <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
              </div>
            )}
          </div>
        </form>
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 rounded-b-2xl">
          <div className="flex justify-end gap-4">
            <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 dark:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-600">
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 disabled:bg-indigo-400"
              disabled={!title || !description || !category || isGenerating}
            >
              {isEditMode ? 'Save Changes' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};