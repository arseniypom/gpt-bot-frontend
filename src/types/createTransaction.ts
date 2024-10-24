import { PackageName } from './packages';

type PaymentEvent =
  | 'payment.succeeded'
  | 'payment.canceled'
  | 'refund.succeeded';

export interface CreateTransactionBody {
  type: 'notification';
  event: PaymentEvent;
  object: {
    id: string;
    status: string;
    amount: { value: string; currency: 'RUB' };
    metadata: {
      telegramId: number;
      packageName: PackageName;
      basicRequestsBalance: number | undefined;
      proRequestsBalance: number | undefined;
      imageGenerationBalance: number | undefined;
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
