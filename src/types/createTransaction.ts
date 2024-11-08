import { PackageName, SubscriptionLevel } from './packagesAndSubscriptions';

type PaymentEvent =
  | 'payment.succeeded'
  | 'payment.canceled'
  | 'refund.succeeded';
export type PaymentStatus = 'succeeded' | 'canceled';

export interface PackageMetadata {
  telegramId: string;
  packageName: PackageName;
  basicRequestsBalance?: string;
  proRequestsBalance?: string;
  imageGenerationBalance?: string;
}

export interface SubscriptionMetadata {
  telegramId: string;
  subscriptionLevel: SubscriptionLevel;
  basicRequestsPerDay: number;
  proRequestsPerDay?: number;
  imageGenerationPerDay?: number;
  subscriptionDuration: SubscriptionDuration;
}

// It's a stringified object of type { days?: number; months?: number }
export type SubscriptionDuration = string;

export interface SubscriptionPaymentMethod {
  type: string;
  id: string;
  saved: boolean;
  title?: string;
  account_number?: string;
}

export interface CreateTransactionBody {
  type: 'notification';
  event: PaymentEvent;
  object: {
    id: string;
    status: PaymentStatus;
    amount: { value: string; currency: 'RUB' };
    metadata: PackageMetadata | SubscriptionMetadata;
    cancellation_details?: CancellationDetails;
    payment_method: SubscriptionPaymentMethod;
  };
}

export interface CancellationDetails {
  party?: string;
  reason?: string;
}

export const isValidCreateTransactionBody = (
  body: CreateTransactionBody,
): body is CreateTransactionBody => {
  return (
    body.type === 'notification' &&
    ['payment.succeeded', 'payment.canceled', 'refund.succeeded'].includes(
      body.event,
    ) &&
    !!body.object.id &&
    !!body.object.status &&
    !!body.object.amount.value &&
    !!body.object.metadata.telegramId
  );
};

export const isPackageTransaction = (
  metadata: PackageMetadata | SubscriptionMetadata,
): metadata is PackageMetadata => {
  return 'packageName' in metadata;
};

export const isSubscriptionTransaction = (
  metadata: PackageMetadata | SubscriptionMetadata,
): metadata is SubscriptionMetadata => {
  return 'subscriptionLevel' in metadata;
};
