// Effective plan = subscription plan + admin RBAC bypass.
// Admins get unlimited limits, all models, and BYOK access regardless of tier.
import { useUserPlan } from './useUserPlan';
import { useUserRole } from './useUserRole';

const ALL_MODELS = [
  'google/gemini-3-flash-preview',
  'google/gemini-3.1-flash-lite-preview',
  'google/gemini-3.5-flash',
  'google/gemini-3.1-pro-preview',
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
  'openai/gpt-5',
  'openai/gpt-5-mini',
  'openai/gpt-5-nano',
  'openai/gpt-5.2',
  'openai/gpt-5.4',
  'openai/gpt-5.4-mini',
  'openai/gpt-5.4-pro',
  'openai/gpt-5.5',
  'openai/gpt-5.5-pro',
];

export function useEffectivePlan() {
  const plan = useUserPlan();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const admin = isAdmin();

  if (admin) {
    return {
      ...plan,
      plan: 'admin' as const,
      allowedModels: ALL_MODELS,
      dailyLimit: Number.POSITIVE_INFINITY,
      monthlyLimit: Number.POSITIVE_INFINITY,
      dailyRemaining: Number.POSITIVE_INFINITY,
      monthlyRemaining: Number.POSITIVE_INFINITY,
      byokEnabled: true,
      isFree: false,
      isPro: false,
      isPremium: true,
      isAdmin: true,
      isLoading: plan.isLoading || roleLoading,
    };
  }

  return { ...plan, isAdmin: false, isLoading: plan.isLoading || roleLoading };
}

export default useEffectivePlan;
