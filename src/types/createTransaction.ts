import { PackageName } from './packages';

type PaymentEvent =
  | 'payment.succeeded'
  | 'payment.canceled'
  | 'refund.succeeded';
type PaymentStatus = 'succeeded' | 'canceled';

export interface CreateTransactionBody {
  type: 'notification';
  event: PaymentEvent;
  object: {
    id: string;
    status: PaymentStatus;
    amount: { value: string; currency: 'RUB' };
    metadata: {
      telegramId: string;
      packageName: PackageName;
      basicRequestsBalance: string | undefined;
      proRequestsBalance: string | undefined;
      imageGenerationBalance: string | undefined;
    };
  };
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
