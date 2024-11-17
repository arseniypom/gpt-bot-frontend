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
import { SubscriptionLevels } from '@/types';

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
    throw new Error(
      `handlePackageTransactionSuccess: Invalid amount (${amount.value}), yookassaPaymentId: ${id}, telegramId: ${metadata.telegramId}`,
    );
  }
  await PackageTransaction.create({
    telegramId: metadata.telegramId,
    email: metadata.email,
    totalAmount: totalAmountInt,
    packageName: metadata.packageName,
    yookassaPaymentId: id,
    status,
  });

  const user = await User.findOne({ telegramId: metadata.telegramId });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  user.tokensBalance += Number(metadata.tokensNumber);
  user.email = metadata.email;
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

Добавлено 🪙 *${metadata.tokensNumber}* токенов
Текущий баланс: 🪙 *${user.tokensBalance}*

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
    throw new Error('handlePackageTransactionSuccess:Bot API key is not provided');
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
    email: metadata.email,
    totalAmount: totalAmountInt,
    packageName: metadata.packageName,
    yookassaPaymentId: id,
    status,
    cancellationDetails: details,
  });

  const user = await User.findOne({ telegramId: metadata.telegramId });
  if (!user) {
    throw new Error(
      `handlePackageTransactionCanceled: User not found, yookassaPaymentId: ${id}, telegramId: ${metadata.telegramId}`,
    );
  }
  user.email = metadata.email;
  user.updatedAt = new Date();
  await user.save();

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
    throw new Error('handlePackageTransactionCanceled: Bot API key is not provided');
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
    throw new Error(
      `handleSubscriptionTransactionSuccess: Invalid amount (${amount.value}), yookassaPaymentId: ${id}, telegramId: ${metadata.telegramId}`,
    );
  }
  await SubscriptionTransaction.create({
    telegramId: metadata.telegramId,
    email: metadata.email,
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

  if (metadata.subscriptionLevel === SubscriptionLevels.OPTIMUM_TRIAL) {
    user.newSubscriptionLevel = SubscriptionLevels.OPTIMUM;
    user.hasActivatedTrial = true;
  }

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
  user.subscriptionDuration = subscriptionDuration;
  user.basicRequestsLeftThisWeek = Number(metadata.basicRequestsPerWeek);
  user.basicRequestsLeftToday = Number(metadata.basicRequestsPerDay);
  if (metadata.proRequestsPerMonth) {
    user.proRequestsLeftThisMonth = Number(metadata.proRequestsPerMonth);
  }
  if (metadata.imageGenerationPerMonth) {
    user.imageGenerationLeftThisMonth = Number(
      metadata.imageGenerationPerMonth,
    );
  }
  user.weeklyRequestsExpiry = null;
  user.email = metadata.email;
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
                [{ text: '👤 Мой профиль' }, { text: '⚙️ Настройки' }],
                [{ text: '🪙 Купить токены' }],
                [
                  {
                    text: '🖼️ Сгенерировать изображение',
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
        throw new Error(
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
      throw new Error(`Error in sending tg message`, { cause: error });
    }
  } else {
    throw new Error('handleSubscriptionTransactionSuccess:Bot API key is not provided');
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
    throw new Error(
      `handleSubscriptionTransactionCanceled: Invalid amount (${amount.value}), yookassaPaymentId: ${id}, telegramId: ${metadata.telegramId}`,
    );
  }
  await SubscriptionTransaction.create({
    telegramId: metadata.telegramId,
    email: metadata.email,
    totalAmount: totalAmountInt,
    subscriptionLevel: metadata.subscriptionLevel,
    yookassaPaymentId: id,
    yookassaPaymentMethodId: paymentMethod.id,
    status,
    cancellationDetails: details,
  });

  const user = await User.findOne({ telegramId: metadata.telegramId });
  if (!user) {
    throw new Error('handlePackageTransactionCanceled: User not found');
  }
  user.email = metadata.email;
  user.updatedAt = new Date();
  await user.save();

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
    throw new Error('handlePackageTransactionCanceled:Bot API key is not provided');
  }

  return res
    .status(200)
    .json({ message: 'Transaction with canceled status saved' });
};
