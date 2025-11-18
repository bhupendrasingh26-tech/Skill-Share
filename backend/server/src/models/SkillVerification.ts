import mongoose, { Schema, Document } from 'mongoose';

export interface ISkillVerification extends Document {
  userId: mongoose.Types.ObjectId;
  skill: string;
  claimedLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  behaviorScore: number; // 0-100, based on actual behavior
  flags: {
    neverHelped: boolean;
    irrelevantContent: boolean;
    failedRequests: boolean;
    skillMismatch: boolean;
  };
  metrics: {
    postsCount: number;
    postsRelevantToSkill: number;
    requestsReceived: number;
    requestsAccepted: number;
    requestsDeclined: number;
    messagesSent: number;
    helpfulMessagesCount: number;
  };
  aiAnalysis: {
    lastAnalyzed: Date;
    confidence: number; // 0-100
    reasoning: string;
    recommendation: 'verified' | 'warning' | 'flagged';
  };
  createdAt: Date;
  updatedAt: Date;
}

const SkillVerificationSchema = new Schema<ISkillVerification>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    skill: {
      type: String,
      required: [true, 'Skill is required'],
      index: true,
    },
    claimedLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate',
    },
    behaviorScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    flags: {
      neverHelped: {
        type: Boolean,
        default: false,
      },
      irrelevantContent: {
        type: Boolean,
        default: false,
      },
      failedRequests: {
        type: Boolean,
        default: false,
      },
      skillMismatch: {
        type: Boolean,
        default: false,
      },
    },
    metrics: {
      postsCount: {
        type: Number,
        default: 0,
      },
      postsRelevantToSkill: {
        type: Number,
        default: 0,
      },
      requestsReceived: {
        type: Number,
        default: 0,
      },
      requestsAccepted: {
        type: Number,
        default: 0,
      },
      requestsDeclined: {
        type: Number,
        default: 0,
      },
      messagesSent: {
        type: Number,
        default: 0,
      },
      helpfulMessagesCount: {
        type: Number,
        default: 0,
      },
    },
    aiAnalysis: {
      lastAnalyzed: {
        type: Date,
        default: Date.now,
      },
      confidence: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      reasoning: {
        type: String,
        default: '',
      },
      recommendation: {
        type: String,
        enum: ['verified', 'warning', 'flagged'],
        default: 'verified',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
SkillVerificationSchema.index({ userId: 1, skill: 1 }, { unique: true });
SkillVerificationSchema.index({ userId: 1, 'aiAnalysis.recommendation': 1 });
SkillVerificationSchema.index({ behaviorScore: 1 });

export default mongoose.model<ISkillVerification>('SkillVerification', SkillVerificationSchema);


