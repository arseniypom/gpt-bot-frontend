import { NextApiRequest, NextApiResponse } from 'next';
import ipRangeCheck from 'ip-range-check';
import { isValidCreateTransactionBody } from '@/types';
import YookassaTransaction from '@/models/YookassaTransaction';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

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

    try {
      switch (body.event) {
        case 'payment.succeeded': {
          const { id, status, amount, metadata } = body.object;
          const totalAmountInt = parseFloat(amount.value);
          if (isNaN(totalAmountInt)) {
            return res.status(400).json({ error: 'Invalid amount' });
          }
          await YookassaTransaction.create({
            telegramId: metadata.telegramId,
            totalAmount: totalAmountInt,
            packageName: metadata.packageName,
            yookassaPaymentId: id,
            status,
          });

          const user = await User.findOne({ telegramId: metadata.telegramId });
          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }
          if (metadata.basicRequestsBalance) {
            user.basicRequestsBalance += metadata.basicRequestsBalance;
          }
          if (metadata.proRequestsBalance) {
            user.proRequestsBalance += metadata.proRequestsBalance;
          }
          if (metadata.imageGenerationBalance) {
            user.imageGenerationBalance += metadata.imageGenerationBalance;
          }
          user.updatedAt = new Date();
          await user.save();

          return res.status(200).json({ message: 'Transaction saved' });
        }

        case 'payment.canceled': {
          const { id, status, amount, metadata } = body.object;
          const totalAmountInt = parseFloat(amount.value);
          if (isNaN(totalAmountInt)) {
            return res.status(400).json({ error: 'Invalid amount' });
          }
          await YookassaTransaction.create({
            telegramId: metadata.telegramId,
            totalAmount: totalAmountInt,
            packageName: metadata.packageName,
            yookassaPaymentId: id,
            status,
          });
          break;
        }

        case 'refund.succeeded': {
          // TODO: Handle refund success logic
          break;
        }

        default:
          return res.status(400).json({ error: 'Invalid event' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to save transaction' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
