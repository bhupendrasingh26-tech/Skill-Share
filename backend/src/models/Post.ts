import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  title: string;
  description: string;
  category: string;
  tags: string[];
  author: mongoose.Types.ObjectId;
  budget?: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for the post'],
      minlength: 5,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      minlength: 10,
      maxlength: 5000,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: ['Programming', 'Development', 'Design', 'Marketing', 'Business', 'Language', 'Music', 'Other'],
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 10,
        message: 'Maximum 10 tags allowed',
      },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post must have an author'],
    },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ category: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });

export default mongoose.model<IPost>('Post', PostSchema);
