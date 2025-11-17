import mongoose, { Schema, Document } from 'mongoose';

export interface ISkillRequest extends Document {
  requesterId: mongoose.Types.ObjectId;
  targetUserId?: mongoose.Types.ObjectId; // If targeting a specific user, optional
  skill: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  acceptedAt?: Date;
  declinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SkillRequestSchema = new Schema<ISkillRequest>(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester ID is required'],
      index: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    skill: {
      type: String,
      required: [true, 'Skill is required'],
      minlength: 2,
      maxlength: 100,
      lowercase: true,
      trim: true,
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      minlength: 5,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'declined'],
        message: 'Status must be pending, accepted, or declined',
      },
      default: 'pending',
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    declinedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
SkillRequestSchema.index({ requesterId: 1, createdAt: -1 });
SkillRequestSchema.index({ targetUserId: 1, status: 1, createdAt: -1 });
SkillRequestSchema.index({ skill: 1, status: 1 });
SkillRequestSchema.index({ status: 1, createdAt: -1 });

// Update timestamp when status changes
SkillRequestSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'accepted' && !this.acceptedAt) {
      this.acceptedAt = new Date();
    } else if (this.status === 'declined' && !this.declinedAt) {
      this.declinedAt = new Date();
    }
  }
  next();
});

export default mongoose.model<ISkillRequest>('SkillRequest', SkillRequestSchema);
