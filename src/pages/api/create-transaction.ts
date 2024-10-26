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
            user.basicRequestsBalance += Number(metadata.basicRequestsBalance);
          }
          if (metadata.proRequestsBalance) {
            user.proRequestsBalance += Number(metadata.proRequestsBalance);
          }
          if (metadata.imageGenerationBalance) {
            user.imageGenerationBalance += Number(
              metadata.imageGenerationBalance,
            );
          }
          user.updatedAt = new Date();
          await user.save();

          const BOT_API_KEY =
            process.env.NODE_ENV === 'production'
              ? process.env.BOT_API_KEY_PROD
              : process.env.BOT_API_KEY_DEV;

          try {
            await fetch(
              `https://api.telegram.org/bot${BOT_API_KEY}/sendMessage`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  chat_id: metadata.telegramId,
                  parse_mode: 'MarkdownV2',
                  text: `*Баланс пополнен!🎉*\n_Благодарим за покупку_`,
                }),
              },
            );
            await fetch(
              `https://api.telegram.org/bot${BOT_API_KEY}/sendMessage`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  chat_id: metadata.telegramId,
                  parse_mode: 'MarkdownV2',
                  text: `*Ваш текущий баланс 💰 *
––––––
*Базовые запросы* \\(GPT\\-3\\.5, GPT\\-4o\\-mini\\):
⭐️ ${user.basicRequestsBalance}
*PRO запросы* \\(GPT\\-4o\\):
🌟 ${user.proRequestsBalance}
*Генерация изображений*:
🖼️ ${user.imageGenerationBalance}`,
                }),
              },
            );
          } catch (error) {
            console.error('failed to send telegram message', error);
          }

          return res
            .status(200)
            .json({ message: 'Transaction with succeeded status saved' });
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

          return res
            .status(200)
            .json({ message: 'Transaction with canceled status saved' });
        }

        case 'refund.succeeded': {
          const { id, status, amount, metadata } = body.object;
          await YookassaTransaction.create({
            telegramId: metadata.telegramId,
            totalAmount: amount.value,
            packageName: metadata.packageName,
            yookassaPaymentId: id,
            status,
          });

          return res
            .status(200)
            .json({ message: 'Transaction with refund status saved' });
        }

        default:
          throw new Error('Invalid event');
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
