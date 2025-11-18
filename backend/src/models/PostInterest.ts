import mongoose, { Schema, Document } from 'mongoose';

export interface IPostInterest extends Document {
  userId: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PostInterestSchema = new Schema<IPostInterest>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post ID is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only mark interest once per post
PostInterestSchema.index({ userId: 1, postId: 1 }, { unique: true });

export default mongoose.model<IPostInterest>('PostInterest', PostInterestSchema);
