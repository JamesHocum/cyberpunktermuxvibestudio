import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type PlanTier = 'free' | 'pro' | 'premium';

export interface UserPlan {
  plan: PlanTier;
  dailyLimit: number;
  monthlyLimit: number;
  allowedModels: string[];
  byokEnabled: boolean;
}

const FREE_DEFAULTS: UserPlan = {
  plan: 'free',
  dailyLimit: 15,
  monthlyLimit: 100,
  allowedModels: ['google/gemini-3-flash-preview', 'google/gemini-2.5-flash-lite'],
  byokEnabled: false,
};

export function useUserPlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<UserPlan>(FREE_DEFAULTS);
  const [dailyUsed, setDailyUsed] = useState(0);
  const [monthlyUsed, setMonthlyUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    if (!user?.id) {
      setPlan(FREE_DEFAULTS);
      setDailyUsed(0);
      setMonthlyUsed(0);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch plan
      const { data: planData } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (planData) {
        setPlan({
          plan: planData.plan as PlanTier,
          dailyLimit: planData.daily_limit,
          monthlyLimit: planData.monthly_limit,
          allowedModels: planData.allowed_models,
          byokEnabled: planData.byok_enabled,
        });
      } else {
        setPlan(FREE_DEFAULTS);
      }

      // Fetch daily usage count
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { count: dailyCount } = await supabase
        .from('ai_usage_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString());

      setDailyUsed(dailyCount || 0);

      // Fetch monthly usage count
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { count: monthlyCount } = await supabase
        .from('ai_usage_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString());

      setMonthlyUsed(monthlyCount || 0);
    } catch (err) {
      console.error('[useUserPlan] Error fetching plan:', err);
      setPlan(FREE_DEFAULTS);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const dailyRemaining = Math.max(0, plan.dailyLimit - dailyUsed);
  const monthlyRemaining = Math.max(0, plan.monthlyLimit - monthlyUsed);

  return {
    ...plan,
    dailyUsed,
    monthlyUsed,
    dailyRemaining,
    monthlyRemaining,
    isFree: plan.plan === 'free',
    isPro: plan.plan === 'pro',
    isPremium: plan.plan === 'premium',
    isLoading,
    refreshPlan: fetchPlan,
  };
}

export default useUserPlan;
