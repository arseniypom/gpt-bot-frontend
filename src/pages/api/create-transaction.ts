import { NextApiRequest, NextApiResponse } from 'next';
import ipRangeCheck from 'ip-range-check';
import {
  isPackageTransaction,
  isSubscriptionTransaction,
  isValidCreateTransactionBody,
} from '@/types';
import PackageTransaction from '@/models/PackageTransaction';
import SubscriptionTransaction from '@/models/SubscriptionTransaction';
import dbConnect from '@/lib/mongodb';
import {
  handlePackageTransactionSuccess,
  handleSubscriptionTransactionSuccess,
  handlePackageTransactionCanceled,
  handleSubscriptionTransactionCanceled,
} from '@/utils/transacrionUtils';

// List of allowed IPs and subnets
const allowedIPs = [
  '185.71.76.0/27',
  '185.71.77.0/27',
  '77.75.153.0/25',
  '77.75.156.11',
  '77.75.156.35',
  '77.75.154.128/25',
  '2a02:5180::/32',
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await dbConnect();

  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!clientIP || !ipRangeCheck(clientIP as string, allowedIPs)) {
    return res.status(403).json({ error: 'Forbidden: IP not allowed' });
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (!isValidCreateTransactionBody(body)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    const { id, status, amount, metadata, payment_method } = body.object;
    const BOT_API_KEY =
      process.env.NODE_ENV === 'production'
        ? process.env.BOT_API_KEY_PROD
        : process.env.BOT_API_KEY_DEV;

    try {
      switch (body.event) {
        case 'payment.succeeded': {
          if (isPackageTransaction(metadata)) {
            await handlePackageTransactionSuccess({
              res,
              id,
              status,
              amount,
              metadata,
              botApiKey: BOT_API_KEY,
            });
          } else if (isSubscriptionTransaction(metadata)) {
            await handleSubscriptionTransactionSuccess({
              res,
              id,
              status,
              amount,
              metadata,
              paymentMethod: payment_method,
              botApiKey: BOT_API_KEY,
            });
          } else {
            throw new Error('Invalid metadata in payment.succeeded');
          }
        }

        case 'payment.canceled': {
          if (isPackageTransaction(metadata)) {
            await handlePackageTransactionCanceled({
              res,
              id,
              status,
              amount,
              metadata,
              botApiKey: BOT_API_KEY,
              details: body.object.cancellation_details,
            });
          } else if (isSubscriptionTransaction(metadata)) {
            await handleSubscriptionTransactionCanceled({
              res,
              id,
              status,
              amount,
              metadata,
              paymentMethod: payment_method,
              botApiKey: BOT_API_KEY,
              details: body.object.cancellation_details,
            });
          } else {
            throw new Error('Invalid metadata in payment.canceled');
          }
        }

        case 'refund.succeeded': {
          if (isPackageTransaction(metadata)) {
            await PackageTransaction.create({
              telegramId: metadata.telegramId,
              totalAmount: amount.value,
              packageName: metadata.packageName,
              yookassaPaymentId: id,
              status,
            });
          } else if (isSubscriptionTransaction(metadata)) {
            await SubscriptionTransaction.create({
              telegramId: metadata.telegramId,
              totalAmount: amount.value,
              subscriptionLevel: metadata.subscriptionLevel,
              yookassaPaymentId: id,
              yookassaPaymentMethodId: payment_method.id,
              status,
            });
          } else {
            throw new Error('Invalid metadata in refund.succeeded');
          }
          return res.status(200).json({ message: 'Transaction with refund status saved' });
        }

        default:
          throw new Error('Invalid event');
      }
    } catch (error) {
      console.error(error);
      await fetch(`https://api.telegram.org/bot${BOT_API_KEY}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: process.env.ADMIN_TELEGRAM_ID,
          parse_mode: 'MarkdownV2',
          text: `ERROR: failed to save transaction | yookassaPaymentId ${id} | event ${
            body.event
          } | ${JSON.stringify(error)}`,
        }),
      });
      return res.status(500).json({ error: 'Failed to save transaction' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
