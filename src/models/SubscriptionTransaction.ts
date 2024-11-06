import { Schema, model } from 'mongoose';
import { SubscriptionLevel } from '@/types/packagesAndSubscriptions';

export interface SubscriptionTransaction {
  telegramId: number;
  totalAmount: number;
  subscriptionLevel: SubscriptionLevel;
  yookassaPaymentId: string;
  yookassaPaymentMethodId: string;
  status: string;
  createdAt: Date;
}

const subscriptionTransactionSchema: Schema<SubscriptionTransaction> =
  new Schema({
    telegramId: { type: Number, required: true },
    totalAmount: { type: Number },
    subscriptionLevel: { type: String, required: true },
    yookassaPaymentId: { type: String, required: true },
    yookassaPaymentMethodId: { type: String, required: true },
    status: { type: String, required: true },
    createdAt: {
      type: Date,
      default: () => Date.now(),
    },
  });

export default model<SubscriptionTransaction>(
  'subscription_transaction',
  subscriptionTransactionSchema,
);
