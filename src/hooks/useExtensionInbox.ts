import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface BridgeInboxItem {
  id: string;
  source: string;
  origin_url: string | null;
  page_title: string | null;
  selection: string | null;
  prompt: string | null;
  metadata: Record<string, unknown>;
  consumed: boolean;
  created_at: string;
}

export function useExtensionInbox(pollMs = 15000) {
  const { user, session } = useAuth();
  const [items, setItems] = useState<BridgeInboxItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("extension_context")
        .select("*")
        .eq("user_id", user.id)
        .eq("consumed", false)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!error && data) setItems(data as BridgeInboxItem[]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const consume = useCallback(
    async (id: string) => {
      if (!user?.id) return;
      await supabase
        .from("extension_context")
        .update({ consumed: true, consumed_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [user?.id],
  );

  useEffect(() => {
    refresh();
    if (!pollMs) return;
    const t = setInterval(refresh, pollMs);
    return () => clearInterval(t);
  }, [refresh, pollMs]);

  // Realtime subscription so newly-bridged items pop in immediately
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`extension_inbox_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "extension_context",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as BridgeInboxItem;
          if (row && !row.consumed) setItems((prev) => [row, ...prev]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, session?.access_token]);

  return { items, loading, refresh, consume };
}
