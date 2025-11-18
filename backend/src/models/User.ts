import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  bio: string;
  avatarUrl: string;
  skillsOffered: string[];
  skillsNeeded: string[];
  validatedSkills: string[];
  rating: number;
  flaggedSkills?: string[]; // Skills flagged by AI as potentially fake
  portfolioUrl?: string;
  socialMedia?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
  collaborationMethods?: ('Chat' | 'Video Call' | 'In-person')[];
  createdAt: Date;
  updatedAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Please provide a name'],
    },
    bio: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: 'https://via.placeholder.com/150',
    },
    skillsOffered: {
      type: [String],
      default: [],
    },
    skillsNeeded: {
      type: [String],
      default: [],
    },
    validatedSkills: {
      type: [String],
      default: [],
    },
    flaggedSkills: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },
    portfolioUrl: {
      type: String,
      default: '',
    },
    socialMedia: {
      linkedin: String,
      github: String,
      twitter: String,
    },
    collaborationMethods: {
      type: [String],
      enum: ['Chat', 'Video Call', 'In-person'],
      default: ['Chat', 'Video Call'],
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
