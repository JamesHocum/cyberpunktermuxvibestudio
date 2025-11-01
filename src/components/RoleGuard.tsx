import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "moderator";
}

export const RoleGuard = ({ children, requiredRole = "admin" }: RoleGuardProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [hasRole, setHasRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setSession(session);

      // Check if user has required role using the has_role function
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: requiredRole,
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error checking role:", error);
        }
        navigate("/studio");
        return;
      }

      if (!data) {
        navigate("/studio");
        return;
      }

      setHasRole(true);
      setLoading(false);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary">Verifying access...</div>
      </div>
    );
  }

  if (!session || !hasRole) {
    return null;
  }

  return <>{children}</>;
};
