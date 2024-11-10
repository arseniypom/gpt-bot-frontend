import { SubscriptionDuration } from '@/types';
import { SubscriptionLevel } from '@/types/packagesAndSubscriptions';
import dayjs from 'dayjs';
import { Schema, model } from 'mongoose';

export interface User {
  telegramId: number;
  firstName?: string;
  userName?: string;
  basicRequestsBalance: number;
  proRequestsBalance: number;
  imageGenerationBalance: number;
  selectedModel: string;
  basicRequestsLeftThisWeek: number;
  basicRequestsLeftToday: number;
  proRequestsLeftThisMonths: number;
  imageGenerationLeftThisMonths: number;
  subscriptionLevel: SubscriptionLevel;
  newSubscriptionLevel: SubscriptionLevel | null;
  subscriptionExpiry: Date | null;
  weeklyRequestsExpiry: Date | null;
  subscriptionDuration?: SubscriptionDuration | null;
  unsubscribeReason: string | null;
  yookassaPaymentMethodId: string | null;
  coinsBalance: number;
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
  basicRequestsLeftThisWeek: {
    type: Number,
    required: true,
  },
  basicRequestsLeftToday: {
    type: Number,
    required: true,
  },
  proRequestsLeftThisMonths: {
    type: Number,
    required: true,
  },
  imageGenerationLeftThisMonths: {
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
  weeklyRequestsExpiry: {
    type: Date,
    default: dayjs().add(7, 'day').toDate(),
  },
  subscriptionDuration: {
    type: Object,
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
  coinsBalance: {
    type: Number,
    default: 0,
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
