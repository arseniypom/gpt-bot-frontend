import {
  CancellationDetails,
  isValidSubscriptionDuration,
  PackageMetadata,
  PaymentStatus,
  SubscriptionMetadata,
  SubscriptionPaymentMethod,
} from '@/types/createTransaction';
import PackageTransaction from '@/models/PackageTransaction';
import SubscriptionTransaction from '@/models/SubscriptionTransaction';
import User from '@/models/User';
import { NextApiResponse } from 'next';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

export const handlePackageTransactionSuccess = async ({
  res,
  id,
  status,
  amount,
  metadata,
  botApiKey,
}: {
  res: NextApiResponse;
  id: string;
  status: PaymentStatus;
  amount: { value: string };
  metadata: PackageMetadata;
  botApiKey?: string;
}) => {
  const totalAmountInt = parseFloat(amount.value);
  if (isNaN(totalAmountInt)) {
    res.status(400).json({ error: 'Invalid amount' });
    throw new Error('Invalid amount');
  }
  await PackageTransaction.create({
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
    user.imageGenerationBalance += Number(metadata.imageGenerationBalance);
  }
  user.updatedAt = new Date();
  await user.save();

  if (botApiKey) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botApiKey}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: metadata.telegramId,
            parse_mode: 'MarkdownV2',
            text: `*Баланс пополнен 🎉*

Текущий баланс:
*Базовые запросы* _\\(GPT\\-3\\.5, GPT\\-4o\\-mini\\)_:
⭐️ ${user.basicRequestsBalance}
*PRO запросы* _\\(GPT\\-4o\\)_:
🌟 ${user.proRequestsBalance}
*Генерация изображений*:
🖼️ ${user.imageGenerationBalance}

_Благодарим за покупку\\!_`,
          }),
        },
      );

      if (!response.ok) {
        const jsonData = await response.json();
        throw new Error(
          `Failed to send telegram message to user ${metadata.telegramId} | yookassaPaymentId ${id}: ${jsonData.description}`,
        );
      }
    } catch (error) {
      console.error(`Error in sending tg message`, error);
    }
  } else {
    throw new Error('handlePackageTransaction:Bot API key is not provided');
  }

  return res
    .status(200)
    .json({ message: 'Transaction with succeeded status saved' });
};

export const handlePackageTransactionCanceled = async ({
  res,
  id,
  status,
  amount,
  metadata,
  botApiKey,
  details,
}: {
  res: NextApiResponse;
  id: string;
  status: PaymentStatus;
  amount: { value: string };
  metadata: PackageMetadata;
  botApiKey?: string;
  details?: CancellationDetails;
}) => {
  const totalAmountInt = parseFloat(amount.value);
  if (isNaN(totalAmountInt)) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  await PackageTransaction.create({
    telegramId: metadata.telegramId,
    totalAmount: totalAmountInt,
    packageName: metadata.packageName,
    yookassaPaymentId: id,
    status,
    cancellationDetails: details,
  });

  if (botApiKey) {
    try {
      const responseFromUser = await fetch(
        `https://api.telegram.org/bot${botApiKey}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: metadata.telegramId,
            parse_mode: 'MarkdownV2',
            text: `*Кажется, что\\-то пошло не так 🙁*\nК сожалению, мы не смогли обработать Ваш платеж\\.\n\nПожалуйста, попробуйте ещё раз \\/topup или обратитесь в поддержку \\/support`,
          }),
        },
      );

      if (!responseFromUser.ok) {
        const jsonData = await responseFromUser.json();
        throw new Error(
          `Failed to send telegram message to user ${metadata.telegramId} about canceled payment | yookassaPaymentId ${id}: ${jsonData.description}`,
        );
      }

      const responseFromAdmin = await fetch(
        `https://api.telegram.org/bot${botApiKey}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: process.env.ADMIN_TELEGRAM_ID,
            parse_mode: 'MarkdownV2',
            text: `Отмена платежа:
*YookassaPaymentId*: ${id}
*TgId*: ${metadata.telegramId}
*Details*: ${JSON.stringify(details)}`,
          }),
        },
      );

      if (!responseFromAdmin.ok) {
        const jsonData = await responseFromAdmin.json();
        throw new Error(
          `Failed to send telegram message to admin | yookassaPaymentId ${id}: ${jsonData.description}`,
        );
      }
    } catch (error) {
      console.error(`Error in sending tg message`, error);
    }
  } else {
    throw new Error('handlePackageTransaction:Bot API key is not provided');
  }

  return res
    .status(200)
    .json({ message: 'Transaction with canceled status saved' });
};

export const handleSubscriptionTransactionSuccess = async ({
  res,
  id,
  status,
  amount,
  metadata,
  paymentMethod,
  botApiKey,
}: {
  res: NextApiResponse;
  id: string;
  status: PaymentStatus;
  amount: { value: string };
  metadata: SubscriptionMetadata;
  paymentMethod: SubscriptionPaymentMethod;
  botApiKey?: string;
}) => {
  const totalAmountInt = parseFloat(amount.value);
  if (isNaN(totalAmountInt)) {
    res.status(400).json({ error: 'Invalid amount' });
    throw new Error('Invalid amount');
  }
  await SubscriptionTransaction.create({
    telegramId: metadata.telegramId,
    totalAmount: totalAmountInt,
    subscriptionLevel: metadata.subscriptionLevel,
    yookassaPaymentId: id,
    yookassaPaymentMethodId: paymentMethod.id,
    status,
  });

  const user = await User.findOne({ telegramId: metadata.telegramId });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.subscriptionLevel = metadata.subscriptionLevel;
  user.yookassaPaymentMethodId = paymentMethod.id;
  let subscriptionDuration = JSON.parse(metadata.subscriptionDuration);
  let isValidDuration = true;

  if (!isValidSubscriptionDuration(subscriptionDuration)) {
    isValidDuration = false;
    subscriptionDuration = {
      months: 1,
    };
  }

  if (subscriptionDuration.days) {
    user.subscriptionExpiry = dayjs()
      .add(subscriptionDuration.days, 'day')
      .toDate();
  }
  if (subscriptionDuration.months) {
    user.subscriptionExpiry = dayjs()
      .add(subscriptionDuration.months, 'month')
      .toDate();
  }

  user.basicRequestsBalanceLeftToday += Number(metadata.basicRequestsPerDay);
  if (metadata.proRequestsPerDay) {
    user.proRequestsBalanceLeftToday += Number(metadata.proRequestsPerDay);
  }
  if (metadata.imageGenerationPerDay) {
    user.imageGenerationBalanceLeftToday += Number(
      metadata.imageGenerationPerDay,
    );
  }
  user.updatedAt = new Date();
  await user.save();

  if (botApiKey) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botApiKey}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: metadata.telegramId,
            parse_mode: 'MarkdownV2',
            text: `*Подписка активирована 🎉*

Ваш новый уровень подписки:
*${metadata.subscriptionLevel}*

_Благодарим за покупку\\!_`,
            reply_markup: {
              keyboard: [
                [{ text: '💰 Купить доп. запросы' }],
                [
                  {
                    text: '🪪 Мой профиль',
                  },
                ],
                [
                  {
                    text: '💬 Начать новый чат',
                  },
                ],
                [
                  {
                    text: '🖼️ Сгенерировать изображение',
                  },
                  {
                    text: '🤖 Выбрать AI-модель',
                  },
                ],
                [
                  {
                    text: 'ℹ️ Информация',
                  },
                  {
                    text: '🆘 Поддержка',
                  },
                ],
              ],
              resize_keyboard: true,
              persistent: true,
            },
          }),
        },
      );

      if (!isValidDuration) {
        console.error(
          `Invalid subscription duration: ${metadata.subscriptionDuration} | telegramId ${metadata.telegramId}`,
        );
      }
      if (!response.ok) {
        const jsonData = await response.json();
        throw new Error(
          `Failed to send telegram message to user ${metadata.telegramId} about succeeded subscription payment | yookassaPaymentId ${id}: ${jsonData.description}`,
        );
      }
    } catch (error) {
      console.error(`Error in sending tg message`, error);
    }
  } else {
    throw new Error('handlePackageTransaction:Bot API key is not provided');
  }

  return res
    .status(200)
    .json({ message: 'Transaction with succeeded status saved' });
};

export const handleSubscriptionTransactionCanceled = async ({
  res,
  id,
  status,
  amount,
  metadata,
  paymentMethod,
  botApiKey,
  details,
}: {
  res: NextApiResponse;
  id: string;
  status: PaymentStatus;
  amount: { value: string };
  metadata: SubscriptionMetadata;
  paymentMethod: SubscriptionPaymentMethod;
  botApiKey?: string;
  details?: CancellationDetails;
}) => {
  const totalAmountInt = parseFloat(amount.value);
  if (isNaN(totalAmountInt)) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  await SubscriptionTransaction.create({
    telegramId: metadata.telegramId,
    totalAmount: totalAmountInt,
    subscriptionLevel: metadata.subscriptionLevel,
    yookassaPaymentId: id,
    yookassaPaymentMethodId: paymentMethod.id,
    status,
    cancellationDetails: details,
  });

  if (botApiKey) {
    try {
      const responseFromUser = await fetch(
        `https://api.telegram.org/bot${botApiKey}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: metadata.telegramId,
            parse_mode: 'MarkdownV2',
            text: `*Кажется, что\\-то пошло не так 🙁*\nК сожалению, мы не смогли обработать Ваш платеж\\.\n\nПожалуйста, попробуйте ещё раз \\/subscription или обратитесь в поддержку \\/support`,
          }),
        },
      );

      if (!responseFromUser.ok) {
        const jsonData = await responseFromUser.json();
        throw new Error(
          `Failed to send telegram message to user ${metadata.telegramId} about canceled subscription payment | yookassaPaymentId ${id}: ${jsonData.description}`,
        );
      }

      const responseFromAdmin = await fetch(
        `https://api.telegram.org/bot${botApiKey}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: process.env.ADMIN_TELEGRAM_ID,
            parse_mode: 'MarkdownV2',
            text: `Отмена платежа подписки:
*YookassaPaymentId*: ${id}
*TgId*: ${metadata.telegramId}
*Details*: ${JSON.stringify(details)}`,
          }),
        },
      );

      if (!responseFromAdmin.ok) {
        const jsonData = await responseFromAdmin.json();
        throw new Error(
          `Failed to send telegram message to admin | yookassaPaymentId ${id}: ${jsonData.description}`,
        );
      }
    } catch (error) {
      console.error(`Error in sending tg message`, error);
    }
  } else {
    throw new Error('handlePackageTransaction:Bot API key is not provided');
  }

  return res
    .status(200)
    .json({ message: 'Transaction with canceled status saved' });
};
