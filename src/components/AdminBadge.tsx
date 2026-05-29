import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';

/**
 * Small "ADMIN" chip shown to users with the admin role.
 * Signals that plan-gating is bypassed for development/QA work.
 */
export function AdminBadge({ className = '' }: { className?: string }) {
  const { isAdmin, isLoading } = useUserRole();
  if (isLoading || !isAdmin()) return null;
  return (
    <Badge
      variant="outline"
      className={`gap-1 border-matrix-green/60 bg-matrix-green/10 text-matrix-green ${className}`}
      title="Admin role — all features, models, and limits unlocked"
    >
      <ShieldCheck className="h-3 w-3" /> ADMIN
    </Badge>
  );
}

export default AdminBadge;
