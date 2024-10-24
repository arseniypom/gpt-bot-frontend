import mongoose, { Document, Schema } from 'mongoose';

export interface YookassaTransactionDocument extends Document {
  telegramId: number;
  totalAmount: number;
  packageName: string;
  yookassaPaymentId: string;
  status: string;
  createdAt: Date;
}

const yookassaTransactionSchema = new Schema<YookassaTransactionDocument>({
  telegramId: { type: Number, required: true },
  totalAmount: { type: Number },
  packageName: { type: String, required: true },
  yookassaPaymentId: { type: String, required: true },
  status: { type: String, required: true },
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
});

export default mongoose.model<YookassaTransactionDocument>(
  'YookassaTransaction',
  yookassaTransactionSchema,
);
