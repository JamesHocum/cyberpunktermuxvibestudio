import { useEffect, useState } from 'react';
import { Package, Plus, RefreshCw, Search, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExtensionCard } from './ExtensionCard';
import { ExtensionSubmitForm } from './ExtensionSubmitForm';
import { AdminExtensionPanel } from './AdminExtensionPanel';
import { RoleGuard } from '@/components/RoleGuard';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
export interface Extension {
  id: string;
  name: string;
  description: string | null;
  author: string | null;
  url: string;
  is_approved: boolean;
  is_enabled: boolean;
  downloads: number;
  created_at: string;
}

interface LocalExtension {
  id: string;
  name: string;
  description: string;
  author: string;
  url: string;
}

export function ExtensionManager() {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [localExtensions, setLocalExtensions] = useState<LocalExtension[]>([]);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const { hasRole } = useUserRole();
  const isAdmin = hasRole('admin');
  // Load installed extensions from localStorage
  useEffect(() => {
    const installed = localStorage.getItem('installed_extensions');
    if (installed) {
      setInstalledIds(new Set(JSON.parse(installed)));
    }
  }, []);

  // Fetch extensions from database and local registry
  const fetchExtensions = async () => {
    setIsLoading(true);
    try {
      // Fetch from Supabase (approved extensions)
      const { data: dbExtensions, error } = await supabase
        .from('extensions')
        .select('*')
        .eq('is_approved', true)
        .eq('is_enabled', true);

      if (error) {
        console.error('Error fetching extensions:', error);
      } else {
        setExtensions(dbExtensions || []);
      }

      // Fetch from local registry
      const response = await fetch('/extensions.json');
      if (response.ok) {
        const localData = await response.json();
        setLocalExtensions(localData);
      }
    } catch (err) {
      console.error('Failed to fetch extensions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExtensions();
  }, []);

  const handleInstall = (extensionId: string) => {
    const newInstalled = new Set(installedIds);
    newInstalled.add(extensionId);
    setInstalledIds(newInstalled);
    localStorage.setItem('installed_extensions', JSON.stringify([...newInstalled]));
    toast.success('Extension installed successfully');
  };

  const handleUninstall = (extensionId: string) => {
    const newInstalled = new Set(installedIds);
    newInstalled.delete(extensionId);
    setInstalledIds(newInstalled);
    localStorage.setItem('installed_extensions', JSON.stringify([...newInstalled]));
    toast.success('Extension uninstalled');
  };

  // Filter extensions based on search
  const filteredDbExtensions = extensions.filter(ext =>
    ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ext.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLocalExtensions = localExtensions.filter(ext =>
    ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ext.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allExtensions = [
    ...filteredDbExtensions.map(ext => ({ ...ext, source: 'community' as const })),
    ...filteredLocalExtensions.map(ext => ({ 
      ...ext, 
      source: 'local' as const,
      is_approved: true,
      is_enabled: true,
      downloads: 0,
      created_at: new Date().toISOString()
    }))
  ];

  const installedExtensions = allExtensions.filter(ext => installedIds.has(ext.id));
  const availableExtensions = allExtensions.filter(ext => !installedIds.has(ext.id));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <span className="font-cyber text-primary">EXTENSION_REGISTRY</span>
          <Badge variant="outline" className="text-xs">
            {allExtensions.length} available
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchExtensions}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSubmitForm(!showSubmitForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Submit
          </Button>
        </div>
      </div>

      {/* Submit Form */}
      {showSubmitForm && (
        <ExtensionSubmitForm 
          onClose={() => setShowSubmitForm(false)}
          onSubmitted={fetchExtensions}
        />
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search extensions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 cyber-border bg-studio-terminal"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="w-full cyber-border">
          <TabsTrigger value="browse" className="flex-1">
            Browse ({availableExtensions.length})
          </TabsTrigger>
          <TabsTrigger value="installed" className="flex-1">
            Installed ({installedExtensions.length})
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin" className="flex-1 text-secondary">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="browse">
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : availableExtensions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No extensions match your search' : 'No extensions available'}
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {availableExtensions.map((ext) => (
                  <ExtensionCard
                    key={ext.id}
                    extension={ext}
                    isInstalled={false}
                    onInstall={() => handleInstall(ext.id)}
                    onUninstall={() => handleUninstall(ext.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="installed">
          <ScrollArea className="h-[300px]">
            {installedExtensions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No extensions installed yet
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {installedExtensions.map((ext) => (
                  <ExtensionCard
                    key={ext.id}
                    extension={ext}
                    isInstalled={true}
                    onInstall={() => handleInstall(ext.id)}
                    onUninstall={() => handleUninstall(ext.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Admin Panel Tab */}
        {isAdmin && (
          <TabsContent value="admin">
            <RoleGuard requiredRole="admin">
              <AdminExtensionPanel />
            </RoleGuard>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
