import { Router } from 'express';
import Post from '../models/Post.js';
import User from '../models/User.js';
import SkillVerification from '../models/SkillVerification.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all posts
router.get('/', async (req, res) => {
  try {
    const { category, tag, search } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query = { ...query, category };
    }

    if (tag) {
      query = { ...query, tags: { $in: [tag] } };
    }

    if (search) {
      query = {
        ...query,
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const posts = await Post.find(query)
      .populate('author', 'name avatarUrl bio rating')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET single post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      'author',
      'name avatarUrl bio rating skillsOffered validatedSkills'
    );

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// CREATE post (protected)
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let { title, description, category, tags, budget, mediaUrl, mediaType } = req.body;

    // Basic validation
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Missing required fields: title, description, and category are required' });
    }

    // Validate title length
    if (title.length < 5) {
      return res.status(400).json({ error: 'Title must be at least 5 characters long' });
    }
    if (title.length > 200) {
      return res.status(400).json({ error: 'Title must be no more than 200 characters long' });
    }

    // Validate description length
    if (description.length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters long' });
    }
    if (description.length > 5000) {
      return res.status(400).json({ error: 'Description must be no more than 5000 characters long' });
    }

    // Validate category
    const validCategories = ['Programming', 'Development', 'Design', 'Marketing', 'Business', 'Language', 'Music', 'Other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
    }

    // Validate tags
    const tagsArray = Array.isArray(tags) ? tags : [];
    if (tagsArray.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 tags allowed' });
    }

    // Validate mediaUrl and mediaType consistency
    // Note: Blob URLs (starting with 'blob:') are temporary and not valid for storage
    if (mediaUrl) {
      if (mediaUrl.startsWith('blob:')) {
        // Blob URLs are temporary browser URLs, not valid for storage
        // Set to undefined to skip media for now (frontend should upload to a proper storage service)
        mediaUrl = undefined;
        mediaType = undefined;
      } else if (!mediaType) {
        return res.status(400).json({ error: 'mediaType is required when mediaUrl is provided' });
      }
    }
    if (mediaType && !mediaUrl) {
      return res.status(400).json({ error: 'mediaUrl is required when mediaType is provided' });
    }
    if (mediaType && !['image', 'video'].includes(mediaType)) {
      return res.status(400).json({ error: 'mediaType must be either "image" or "video"' });
    }

    // Validate budget
    if (budget !== undefined && (isNaN(budget) || budget < 0)) {
      return res.status(400).json({ error: 'Budget must be a non-negative number' });
    }

    // Verify author exists before creating post
    const authorExists = await User.findById(req.user.id);
    if (!authorExists) {
      return res.status(404).json({ error: 'Author not found. Please login again.' });
    }

    const post = new Post({
      title: title.trim(),
      description: description.trim(),
      category,
      tags: tagsArray,
      author: req.user.id,
      budget: budget !== undefined ? Number(budget) : 0,
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaType || undefined,
    });

    await post.save();
    await post.populate('author', 'name avatarUrl bio rating');

    // Track behavior for skill verification - check if post is relevant to user's claimed skills
    const author = await User.findById(req.user.id);
    if (author && author.skillsOffered.length > 0) {
      const postContent = `${post.title} ${post.description} ${post.tags.join(' ')} ${post.category}`.toLowerCase();
      
      // Check each skill the user claims to have
      for (const skill of author.skillsOffered) {
        const skillLower = skill.toLowerCase();
        const isRelevant = postContent.includes(skillLower) || 
                          post.tags.some(tag => tag.toLowerCase().includes(skillLower)) ||
                          post.category.toLowerCase().includes(skillLower);
        
        if (isRelevant) {
          // Update skill verification metrics
          await SkillVerification.findOneAndUpdate(
            { userId: req.user.id, skill: skillLower },
            {
              $inc: {
                'metrics.postsCount': 1,
                'metrics.postsRelevantToSkill': 1,
              },
            },
            { upsert: true }
          );
        } else {
          // Still count as a post, but not relevant
          await SkillVerification.findOneAndUpdate(
            { userId: req.user.id, skill: skillLower },
            {
              $inc: {
                'metrics.postsCount': 1,
              },
            },
            { upsert: true }
          );
        }
      }
    }

    // Emit real-time post creation event so connected clients can update without reload
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('post_created', post);
      }
    } catch (emitError) {
      console.error('Failed to emit post_created event:', emitError);
    }

    res.status(201).json(post);
  } catch (error: any) {
    console.error('Post creation error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message).join(', ');
      return res.status(400).json({ error: `Validation error: ${messages}` });
    }
    
    // Handle CastError (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid author ID format' });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Duplicate post detected' });
    }

    res.status(500).json({ 
      error: 'Failed to create post',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// UPDATE post (protected)
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }

    const { title, description, category, tags, budget, mediaUrl, mediaType } = req.body;

    if (title) post.title = title;
    if (description) post.description = description;
    if (category) post.category = category;
    if (tags) post.tags = tags;
    if (budget !== undefined) post.budget = budget;
    if (mediaUrl) post.mediaUrl = mediaUrl;
    if (mediaType) post.mediaType = mediaType as 'image' | 'video';

    await post.save();
    await post.populate('author', 'name avatarUrl bio rating');

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// DELETE post (protected)
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// GET posts by author
router.get('/author/:authorId', async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.authorId })
      .populate('author', 'name avatarUrl bio rating')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch author posts' });
  }
});

export default router;
