import { SubscriptionLevel } from '@/types/packagesAndSubscriptions';
import { Schema, model } from 'mongoose';

export interface User {
  telegramId: number;
  firstName?: string;
  userName?: string;
  basicRequestsBalance: number;
  proRequestsBalance: number;
  imageGenerationBalance: number;
  selectedModel: string;
  basicRequestsBalanceLeftToday: number;
  proRequestsBalanceLeftToday: number;
  imageGenerationBalanceLeftToday: number;
  subscriptionLevel: SubscriptionLevel;
  subscriptionExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema<User> = new Schema({
  telegramId: { type: Number, unique: true, required: true },
  firstName: { type: String },
  userName: { type: String },
  basicRequestsBalance: {
    type: Number,
    default: 15,
    required: true,
  },
  proRequestsBalance: {
    type: Number,
    default: 5,
    required: true,
  },
  imageGenerationBalance: {
    type: Number,
    default: 3,
    required: true,
  },
  selectedModel: {
    type: String,
    required: true,
  },
  subscriptionLevel: {
    type: String,
    required: true,
  },
  subscriptionExpiry: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    immutable: true,
    default: () => Date.now(),
  },
  updatedAt: {
    type: Date,
    default: () => Date.now(),
  },
});

export default model<User>('user', userSchema);
