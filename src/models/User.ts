import { SubscriptionDurationStringified } from '@/types';
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
  newSubscriptionLevel: SubscriptionLevel | null;
  subscriptionExpiry: Date | null;
  subscriptionDuration?: SubscriptionDurationStringified;
  unsubscribeReason: string | null;
  yookassaPaymentMethodId: string | null;
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
  basicRequestsBalanceLeftToday: {
    type: Number,
    required: true,
  },
  proRequestsBalanceLeftToday: {
    type: Number,
    required: true,
  },
  imageGenerationBalanceLeftToday: {
    type: Number,
    required: true,
  },
  subscriptionLevel: {
    type: String,
    required: true,
  },
  newSubscriptionLevel: {
    type: String,
  },
  subscriptionExpiry: {
    type: Date,
    default: null,
  },
  subscriptionDuration: {
    type: String,
    default: null,
  },
  unsubscribeReason: {
    type: String,
    default: null,
  },
  yookassaPaymentMethodId: {
    type: String,
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
