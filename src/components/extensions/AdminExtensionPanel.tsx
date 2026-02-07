import { useEffect, useState } from 'react';
import { Shield, Check, X, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Extension } from './ExtensionManager';

export function AdminExtensionPanel() {
  const [pendingExtensions, setPendingExtensions] = useState<Extension[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPendingExtensions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('extensions')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending extensions:', error);
        toast.error('Failed to load pending extensions');
      } else {
        setPendingExtensions(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending extensions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingExtensions();
  }, []);

  const handleApprove = async (extensionId: string) => {
    setProcessingId(extensionId);
    try {
      const { error } = await supabase
        .from('extensions')
        .update({ is_approved: true, is_enabled: true })
        .eq('id', extensionId);

      if (error) {
        toast.error('Failed to approve extension');
        console.error(error);
      } else {
        toast.success('Extension approved successfully');
        setPendingExtensions(prev => prev.filter(ext => ext.id !== extensionId));
      }
    } catch (err) {
      console.error('Error approving extension:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (extensionId: string) => {
    setProcessingId(extensionId);
    try {
      const { error } = await supabase
        .from('extensions')
        .delete()
        .eq('id', extensionId);

      if (error) {
        toast.error('Failed to reject extension');
        console.error(error);
      } else {
        toast.success('Extension rejected and removed');
        setPendingExtensions(prev => prev.filter(ext => ext.id !== extensionId));
      }
    } catch (err) {
      console.error('Error rejecting extension:', err);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading pending submissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-secondary" />
          <span className="font-cyber text-secondary">ADMIN_APPROVAL_QUEUE</span>
          <Badge variant="outline" className="text-xs border-secondary/50 text-secondary">
            {pendingExtensions.length} pending
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPendingExtensions}
          disabled={isLoading}
          className="cyber-border"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Pending Extensions List */}
      <ScrollArea className="h-[350px]">
        {pendingExtensions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No pending extensions to review</p>
          </div>
        ) : (
          <div className="space-y-3 pr-4">
            {pendingExtensions.map((ext) => (
              <Card key={ext.id} className="cyber-border bg-card/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-cyber text-primary">
                        {ext.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        by {ext.author || 'Anonymous'} • {new Date(ext.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {ext.description || 'No description provided'}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    <a 
                      href={ext.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate max-w-[250px]"
                    >
                      {ext.url}
                    </a>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(ext.id)}
                      disabled={processingId === ext.id}
                      className="flex-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-500/30"
                    >
                      {processingId === ext.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(ext.id)}
                      disabled={processingId === ext.id}
                      className="flex-1"
                    >
                      {processingId === ext.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
