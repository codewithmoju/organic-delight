import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Gift, TrendingUp, Award } from 'lucide-react';
import { toast } from 'sonner';
import {
  getLoyaltyAccount, redeemPoints, pointsToValue,
  LoyaltyAccount, LoyaltyTier, LOYALTY_CONFIG
} from '../../lib/hooks/useLoyalty';
import { formatCurrency } from '../../lib/utils/notifications';

const TIER_CONFIG: Record<LoyaltyTier, { label: string; color: string; bg: string; icon: string }> = {
  bronze: { label: 'Bronze', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: '🥉' },
  silver: { label: 'Silver', color: 'text-slate-500 dark:text-slate-300',   bg: 'bg-slate-500/10 border-slate-500/20',   icon: '🥈' },
  gold:   { label: 'Gold',   color: 'text-yellow-500',                       bg: 'bg-yellow-500/10 border-yellow-500/20', icon: '🥇' },
};

interface CustomerLoyaltyProps {
  customerId: string;
  onRedeemed?: (discount: number) => void;
}

export default function CustomerLoyalty({ customerId, onRedeemed }: CustomerLoyaltyProps) {
  const [account, setAccount] = useState<LoyaltyAccount>(() => getLoyaltyAccount(customerId));
  const [redeemAmount, setRedeemAmount] = useState('');
  const [showRedeem, setShowRedeem] = useState(false);

  useEffect(() => {
    setAccount(getLoyaltyAccount(customerId));
  }, [customerId]);

  const tier = TIER_CONFIG[account.tier];
  const redeemableValue = pointsToValue(account.points);
  const nextTierPoints = account.tier === 'gold'
    ? null
    : account.tier === 'silver'
    ? LOYALTY_CONFIG.TIER_THRESHOLDS.gold - account.lifetime_points
    : LOYALTY_CONFIG.TIER_THRESHOLDS.silver - account.lifetime_points;

  const handleRedeem = () => {
    const pts = parseInt(redeemAmount);
    if (!pts || pts <= 0 || pts % LOYALTY_CONFIG.REDEEM_RATE !== 0) {
      toast.error(`Enter a multiple of ${LOYALTY_CONFIG.REDEEM_RATE} points`);
      return;
    }
    try {
      const discount = redeemPoints(customerId, pts);
      setAccount(getLoyaltyAccount(customerId));
      setRedeemAmount('');
      setShowRedeem(false);
      toast.success(`Redeemed ${pts} points for ${formatCurrency(discount)} discount`);
      onRedeemed?.(discount);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Star className="w-4 h-4 text-yellow-500" />
        Loyalty Rewards
      </h3>

      {/* Tier badge */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${tier.bg}`}>
        <span className="text-2xl">{tier.icon}</span>
        <div className="flex-1">
          <p className={`text-sm font-bold ${tier.color}`}>{tier.label} Member</p>
          <p className="text-xs text-muted-foreground">
            {account.lifetime_points.toLocaleString()} lifetime points
          </p>
        </div>
        {nextTierPoints !== null && nextTierPoints > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{nextTierPoints} pts to next tier</p>
          </div>
        )}
      </div>

      {/* Points balance */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary/30 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Available Points</p>
          <p className="text-xl font-bold text-foreground tabular-nums">{account.points.toLocaleString()}</p>
        </div>
        <div className="bg-secondary/30 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Redeemable Value</p>
          <p className="text-xl font-bold text-success-500 tabular-nums">{formatCurrency(redeemableValue)}</p>
        </div>
      </div>

      {/* Earn rate info */}
      <p className="text-xs text-muted-foreground px-1">
        Earn {LOYALTY_CONFIG.POINTS_PER_100} point per PKR 100 spent.
        Redeem {LOYALTY_CONFIG.REDEEM_RATE} points = {formatCurrency(LOYALTY_CONFIG.REDEEM_VALUE)} discount.
      </p>

      {/* Redeem */}
      {account.points >= LOYALTY_CONFIG.REDEEM_RATE && (
        <div>
          {!showRedeem ? (
            <button
              onClick={() => setShowRedeem(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-sm font-semibold hover:bg-yellow-500/20 transition-colors"
            >
              <Gift className="w-4 h-4" /> Redeem Points
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-secondary/30 rounded-xl p-3 space-y-2 border border-border/40"
            >
              <label className="text-xs font-medium text-muted-foreground block">
                Points to redeem (multiples of {LOYALTY_CONFIG.REDEEM_RATE})
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={LOYALTY_CONFIG.REDEEM_RATE}
                  step={LOYALTY_CONFIG.REDEEM_RATE}
                  max={account.points}
                  value={redeemAmount}
                  onChange={e => setRedeemAmount(e.target.value)}
                  placeholder={`e.g. ${LOYALTY_CONFIG.REDEEM_RATE}`}
                  className="flex-1 h-9 px-3 bg-background border border-border/60 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
                <button onClick={handleRedeem}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity">
                  Redeem
                </button>
                <button onClick={() => setShowRedeem(false)}
                  className="px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
              </div>
              {redeemAmount && parseInt(redeemAmount) >= LOYALTY_CONFIG.REDEEM_RATE && (
                <p className="text-xs text-success-500 font-medium">
                  = {formatCurrency(pointsToValue(parseInt(redeemAmount)))} discount
                </p>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
