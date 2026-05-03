import { readScopedJSON, writeScopedJSON } from '../utils/storageScope';

/**
 * Customer Loyalty / Rewards Program
 *
 * Points system stored in localStorage per customer.
 * Rules:
 *   - Earn 1 point per PKR 100 spent
 *   - Redeem 100 points = PKR 10 discount
 *   - Tiers: Bronze (0-499), Silver (500-1999), Gold (2000+)
 */

export type LoyaltyTier = 'bronze' | 'silver' | 'gold';

export interface LoyaltyAccount {
  customer_id: string;
  points: number;
  lifetime_points: number;
  tier: LoyaltyTier;
  last_updated: string;
}

const POINTS_PER_100 = 1;          // 1 point per PKR 100
const REDEEM_RATE = 100;           // 100 points = PKR 10
const REDEEM_VALUE = 10;

const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  bronze: 0,
  silver: 500,
  gold: 2000,
};

function getKey(customerId: string) {
  return `loyalty_${customerId}`;
}

export function getLoyaltyAccount(customerId: string): LoyaltyAccount {
  try {
    const k = getKey(customerId);
    const parsed = readScopedJSON<LoyaltyAccount | null>(k, null, undefined, k);
    if (parsed) return parsed;
  } catch { /* ignore */ }
  return {
    customer_id: customerId,
    points: 0,
    lifetime_points: 0,
    tier: 'bronze',
    last_updated: new Date().toISOString(),
  };
}

function getTier(lifetimePoints: number): LoyaltyTier {
  if (lifetimePoints >= TIER_THRESHOLDS.gold) return 'gold';
  if (lifetimePoints >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

function saveAccount(account: LoyaltyAccount) {
  writeScopedJSON(getKey(account.customer_id), account);
}

/** Award points for a purchase. Call after a successful sale. */
export function awardPoints(customerId: string, saleAmount: number): LoyaltyAccount {
  const earned = Math.floor(saleAmount / 100) * POINTS_PER_100;
  const account = getLoyaltyAccount(customerId);
  const updated: LoyaltyAccount = {
    ...account,
    points: account.points + earned,
    lifetime_points: account.lifetime_points + earned,
    tier: getTier(account.lifetime_points + earned),
    last_updated: new Date().toISOString(),
  };
  saveAccount(updated);
  return updated;
}

/** Redeem points for a discount. Returns the discount amount in PKR. */
export function redeemPoints(customerId: string, pointsToRedeem: number): number {
  const account = getLoyaltyAccount(customerId);
  if (account.points < pointsToRedeem) throw new Error('Insufficient points');
  if (pointsToRedeem % REDEEM_RATE !== 0) throw new Error(`Points must be a multiple of ${REDEEM_RATE}`);

  const discount = (pointsToRedeem / REDEEM_RATE) * REDEEM_VALUE;
  const updated: LoyaltyAccount = {
    ...account,
    points: account.points - pointsToRedeem,
    last_updated: new Date().toISOString(),
  };
  saveAccount(updated);
  return discount;
}

/** How many PKR a given points balance is worth */
export function pointsToValue(points: number): number {
  return Math.floor(points / REDEEM_RATE) * REDEEM_VALUE;
}

export const LOYALTY_CONFIG = { POINTS_PER_100, REDEEM_RATE, REDEEM_VALUE, TIER_THRESHOLDS };
