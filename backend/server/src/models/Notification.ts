import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  type: 'post_interest' | 'message' | 'call' | 'skill_request';
  title: string;
  message: string;
  data?: {
    postId?: mongoose.Types.ObjectId;
    chatId?: string;
    callType?: 'audio' | 'video';
    skillRequestId?: mongoose.Types.ObjectId;
  };
  seen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient ID is required'],
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
    },
    type: {
      type: String,
      enum: ['post_interest', 'message', 'call', 'skill_request'],
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    data: {
      postId: mongoose.Schema.Types.ObjectId,
      chatId: String,
      callType: {
        type: String,
        enum: ['audio', 'video'],
      },
      skillRequestId: mongoose.Schema.Types.ObjectId,
    },
    seen: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
NotificationSchema.index({ recipientId: 1, seen: 1 });
NotificationSchema.index({ recipientId: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
