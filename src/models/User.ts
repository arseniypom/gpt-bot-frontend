// Импорт необходимых модулей и типов
import mongoose, { Document, Schema } from 'mongoose';

export interface UserDocument extends Document {
  telegramId: number;
  firstName?: string;
  userName?: string;
  basicRequestsBalance: number;
  proRequestsBalance: number;
  imageGenerationBalance: number;
  selectedModel: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema<UserDocument> = new mongoose.Schema({
  telegramId: { type: Number, unique: true, required: true },
  firstName: { type: String },
  userName: { type: String },
  basicRequestsBalance: {
    type: Number,
    default: 20,
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
  createdAt: {
    type: Date,
    immutable: true,
  },
  updatedAt: {
    type: Date,
  },
});

export default mongoose.model<UserDocument>('User', userSchema);
