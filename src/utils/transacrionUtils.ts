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
import { SubscriptionLevels, SubscriptionLevelsLabels } from '@/types';
import AdCampaign from '@/models/AdCampaign';

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
  if (user.adCampaignCode) {
    const adCampaign = await AdCampaign.findOne({ adCode: user.adCampaignCode });
    if (adCampaign) {
      adCampaign.stats.tokensBought += Number(metadata.tokensNumber);
      await adCampaign.save();
    }
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
    throw new Error(
      'handlePackageTransactionSuccess:Bot API key is not provided',
    );
  }
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

  if (botApiKey && details?.reason !== 'expired_on_confirmation') {
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
            text: `*Кажется, что\\-то пошло не так 🙁*\nК сожалению, мы не смогли обработать Вашу оплату пакета токенов 🪙\\.\n\nПожалуйста, попробуйте ещё раз \\/topup или обратитесь в поддержку \\/support`,
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
    throw new Error(
      'handlePackageTransactionCanceled: Bot API key is not provided',
    );
  }
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
  if (user.adCampaignCode) {
    const adCampaign = await AdCampaign.findOne({ adCode: user.adCampaignCode });
    if (adCampaign) {
      if (metadata.subscriptionLevel === SubscriptionLevels.OPTIMUM_TRIAL) {
        adCampaign.stats.trialsBought += 1;
      } else {
        adCampaign.stats.subsBought += 1;
      }
      await adCampaign.save();
    }
  }
  user.subscriptionLevel = metadata.subscriptionLevel;
  user.yookassaPaymentMethodId = paymentMethod.id;
  let subscriptionDuration = JSON.parse(metadata.subscriptionDuration);
  let isValidDuration = true;

  if (metadata.subscriptionLevel === SubscriptionLevels.OPTIMUM_TRIAL) {
    user.newSubscriptionLevel = SubscriptionLevels.OPTIMUM;
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
  user.canActivateTrial = false;
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
*${SubscriptionLevelsLabels[metadata.subscriptionLevel]}*

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
    throw new Error(
      'handleSubscriptionTransactionSuccess:Bot API key is not provided',
    );
  }
};

export const handleSubscriptionTransactionCanceled = async ({
  id,
  status,
  amount,
  metadata,
  paymentMethod,
  botApiKey,
  details,
}: {
  id: string;
  status: PaymentStatus;
  amount: { value: string };
  metadata: SubscriptionMetadata;
  paymentMethod?: SubscriptionPaymentMethod;
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
    yookassaPaymentMethodId: paymentMethod?.id || null,
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

  if (botApiKey && details?.reason !== 'expired_on_confirmation') {
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
            text: `*Кажется, что\\-то пошло не так 🙁*\nК сожалению, мы не смогли обработать Вашу оплату подписки${
              metadata.subscriptionLevel
                ? ` уровня *${
                    SubscriptionLevelsLabels[metadata.subscriptionLevel]
                  }*`
                : ''
            }\\.\n\nПожалуйста, попробуйте ещё раз \\/subscription или обратитесь в поддержку \\/support`,
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
    throw new Error(
      'handlePackageTransactionCanceled:Bot API key is not provided',
    );
  }
};
