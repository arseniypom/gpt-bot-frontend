import { SubscriptionDuration } from '@/types';
import { SubscriptionLevel } from '@/types/packagesAndSubscriptions';
import { ReferralProgram, UserStats } from '@/types/user';
import dayjs from 'dayjs';
import { Schema, model } from 'mongoose';

export interface User {
  telegramId: number;
  firstName?: string;
  userName?: string;
  email?: string;
  selectedModel: string;
  chatMode: string;
  basicRequestsLeftThisWeek: number;
  basicRequestsLeftToday: number;
  proRequestsLeftThisMonth: number;
  imageGenerationLeftThisMonth: number;
  canActivateTrial: boolean;
  subscriptionLevel: SubscriptionLevel;
  newSubscriptionLevel: SubscriptionLevel | null;
  subscriptionExpiry: Date | null;
  weeklyRequestsExpiry: Date | null;
  subscriptionDuration?: SubscriptionDuration | null;
  unsubscribeReason: string | null;
  lastUnsubscribeDate: Date | null;
  yookassaPaymentMethodId: string | null;
  tokensBalance: number;
  userStage: string;
  isBlockedBot: boolean;
  stats: UserStats;
  referralProgram: ReferralProgram;
  usedPromocodes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema<User> = new Schema({
  telegramId: { type: Number, unique: true, required: true },
  firstName: { type: String },
  userName: { type: String },
  email: { type: String },
  selectedModel: {
    type: String,
    required: true,
  },
  chatMode: {
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
  proRequestsLeftThisMonth: {
    type: Number,
    required: true,
  },
  imageGenerationLeftThisMonth: {
    type: Number,
    required: true,
  },
  canActivateTrial: {
    type: Boolean,
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
    default: () => dayjs().add(7, 'day').toDate(),
  },
  subscriptionDuration: {
    type: Object,
    default: null,
  },
  unsubscribeReason: {
    type: String,
    default: null,
  },
  lastUnsubscribeDate: {
    type: Date,
    default: null,
  },
  yookassaPaymentMethodId: {
    type: String,
    default: null,
  },
  tokensBalance: {
    type: Number,
    default: 0,
  },
  userStage: {
    type: String,
  },
  isBlockedBot: {
    type: Boolean,
  },
  stats: {
    type: Object,
  },
  referralProgram: {
    invitedBy: {
      type: Number,
    },
    invitedUserIds: {
      type: [Number],
    },
  },
  usedPromocodes: {
    type: [String],
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
