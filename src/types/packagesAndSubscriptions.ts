export type TokenPackageName = 'token1' | 'token2' | 'token3';

export enum SubscriptionLevels {
  FREE = 'FREE',
  START = 'START',
  OPTIMUM = 'OPTIMUM',
  OPTIMUM_TRIAL = 'OPTIMUM_TRIAL',
  PREMIUM = 'PREMIUM',
  ULTRA = 'ULTRA',
}

export enum SubscriptionLevelsLabels {
  FREE = 'Бесплатный',
  START = 'Стартовый',
  OPTIMUM = 'Оптимум',
  OPTIMUM_TRIAL = 'Оптимум пробный',
  PREMIUM = 'Премиум',
  ULTRA = 'Ультра',
}

export type SubscriptionLevel = keyof typeof SubscriptionLevels;
