export type TokenPackageName = 'token1' | 'token2' | 'token3';

export enum SubscriptionLevels {
  FREE = 'FREE',
  START = 'START',
  OPTIMUM = 'OPTIMUM',
  PREMIUM = 'PREMIUM',
  ULTRA = 'ULTRA',
  OPTIMUM_TRIAL = 'OPTIMUM_TRIAL',
}

export type SubscriptionLevel = keyof typeof SubscriptionLevels;
