import { CancellationDetails } from '@/types';
import { Schema, model } from 'mongoose';

export interface PackageTransaction {
  telegramId: number;
  totalAmount: number;
  packageName: string;
  yookassaPaymentId: string;
  cancellationDetails?: CancellationDetails;
  status: string;
  createdAt: Date;
}

const packageTransactionSchema: Schema<PackageTransaction> = new Schema({
  telegramId: { type: Number, required: true },
  totalAmount: { type: Number },
  packageName: { type: String, required: true },
  yookassaPaymentId: { type: String, required: true },
  cancellationDetails: { type: Object },
  status: { type: String, required: true },
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
});

export default model<PackageTransaction>(
  'package_transaction',
  packageTransactionSchema,
);
