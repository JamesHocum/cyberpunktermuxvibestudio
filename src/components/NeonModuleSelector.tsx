import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Plus, 
  X, 
  Search, 
  Sparkles, 
  Cpu, 
  Database, 
  Palette, 
  Wrench,
  Download,
  Check,
  GripVertical,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface NeonModuleSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  installedPackages: string[];
  onInstallPackage: (packageName: string, version?: string) => void;
  onRemovePackage: (packageName: string) => void;
}

interface ModuleInfo {
  name: string;
  version: string;
  description: string;
  category: 'ui' | 'ai' | 'database' | 'utility';
  icon?: React.ReactNode;
}

const MODULE_CATALOG: ModuleInfo[] = [
  // UI Modules
  { name: 'framer-motion', version: '^10.16.4', description: 'Production-ready motion library', category: 'ui' },
  { name: '@radix-ui/react-dialog', version: '^1.0.5', description: 'Accessible dialog component', category: 'ui' },
  { name: '@radix-ui/react-dropdown-menu', version: '^2.0.6', description: 'Accessible dropdown menus', category: 'ui' },
  { name: '@radix-ui/react-tooltip', version: '^1.0.7', description: 'Accessible tooltips', category: 'ui' },
  { name: 'react-icons', version: '^4.12.0', description: 'Popular icon packs as React components', category: 'ui' },
  { name: 'react-hot-toast', version: '^2.4.1', description: 'Smoking hot notifications', category: 'ui' },
  { name: 'vaul', version: '^0.9.0', description: 'Drawer component for React', category: 'ui' },
  { name: 'cmdk', version: '^0.2.0', description: 'Command menu React component', category: 'ui' },
  
  // AI Modules
  { name: '@huggingface/inference', version: '^2.6.4', description: 'HuggingFace Inference API client', category: 'ai' },
  { name: 'openai', version: '^4.20.1', description: 'OpenAI API client', category: 'ai' },
  { name: 'langchain', version: '^0.0.200', description: 'LLM application framework', category: 'ai' },
  { name: '@xenova/transformers', version: '^2.10.0', description: 'Run transformers in browser', category: 'ai' },
  { name: 'ai', version: '^2.2.31', description: 'Vercel AI SDK', category: 'ai' },
  
  // Database Modules
  { name: '@supabase/supabase-js', version: '^2.39.0', description: 'Supabase client library', category: 'database' },
  { name: 'prisma', version: '^5.7.0', description: 'Next-gen Node.js ORM', category: 'database' },
  { name: 'drizzle-orm', version: '^0.29.0', description: 'TypeScript ORM', category: 'database' },
  { name: '@tanstack/react-query', version: '^5.17.0', description: 'Powerful data synchronization', category: 'database' },
  { name: 'swr', version: '^2.2.4', description: 'React Hooks for data fetching', category: 'database' },
  
  // Utility Modules
  { name: 'zod', version: '^3.22.4', description: 'TypeScript-first schema validation', category: 'utility' },
  { name: 'date-fns', version: '^3.0.0', description: 'Modern date utility library', category: 'utility' },
  { name: 'lodash', version: '^4.17.21', description: 'Utility library', category: 'utility' },
  { name: 'axios', version: '^1.6.2', description: 'Promise based HTTP client', category: 'utility' },
  { name: 'uuid', version: '^9.0.0', description: 'UUID generation', category: 'utility' },
  { name: 'clsx', version: '^2.0.0', description: 'Utility for constructing className strings', category: 'utility' },
  { name: 'nanoid', version: '^5.0.4', description: 'Tiny unique ID generator', category: 'utility' },
  { name: 'immer', version: '^10.0.3', description: 'Immutable state management', category: 'utility' },
];

const CATEGORY_CONFIG = {
  ui: { label: 'UI Components', icon: <Palette className="h-4 w-4" />, color: 'neon-cyan' },
  ai: { label: 'AI & ML', icon: <Cpu className="h-4 w-4" />, color: 'neon-purple' },
  database: { label: 'Database', icon: <Database className="h-4 w-4" />, color: 'neon-green' },
  utility: { label: 'Utilities', icon: <Wrench className="h-4 w-4" />, color: 'neon-pink' },
};

export const NeonModuleSelector: React.FC<NeonModuleSelectorProps> = ({
  isVisible,
  onClose,
  installedPackages,
  onInstallPackage,
  onRemovePackage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [installingPackage, setInstallingPackage] = useState<string | null>(null);
  const [draggedModule, setDraggedModule] = useState<string | null>(null);

  if (!isVisible) return null;

  const isInstalled = (packageName: string) => installedPackages.includes(packageName);

  const filteredModules = MODULE_CATALOG.filter(mod => {
    const matchesSearch = mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         mod.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || mod.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = async (mod: ModuleInfo) => {
    setInstallingPackage(mod.name);
    
    // Simulate installation delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onInstallPackage(mod.name, mod.version);
    toast.success(`Installed ${mod.name}`);
    setInstallingPackage(null);
  };

  const handleRemove = (packageName: string) => {
    onRemovePackage(packageName);
    toast.success(`Removed ${packageName}`);
  };

  const handleDragStart = (e: React.DragEvent, mod: ModuleInfo) => {
    setDraggedModule(mod.name);
    e.dataTransfer.setData('module', JSON.stringify(mod));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggedModule(null);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const modData = e.dataTransfer.getData('module');
    if (modData) {
      const mod = JSON.parse(modData) as ModuleInfo;
      if (!isInstalled(mod.name)) {
        await handleInstall(mod);
      }
    }
    setDraggedModule(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <Card className="w-full max-w-5xl mx-4 bg-studio-sidebar border-2 cyber-border neon-glow max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b cyber-border pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-cyber neon-green">
              <Package className="h-5 w-5" />
              NEON_MODULE_SELECTOR.SYS
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="cyber-border">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-studio-terminal cyber-border font-terminal"
            />
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-4">
          <div className="flex gap-4 h-full">
            {/* Module catalog */}
            <div className="flex-1 flex flex-col">
              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1 flex flex-col">
                <TabsList className="bg-studio-terminal cyber-border mb-4">
                  <TabsTrigger value="all" className="font-terminal text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    ALL
                  </TabsTrigger>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <TabsTrigger key={key} value={key} className="font-terminal text-xs">
                      {config.icon}
                      <span className="ml-1 hidden sm:inline">{config.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <ScrollArea className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-4">
                    {filteredModules.map((mod) => {
                      const installed = isInstalled(mod.name);
                      const installing = installingPackage === mod.name;
                      const isDragged = draggedModule === mod.name;
                      const categoryConfig = CATEGORY_CONFIG[mod.category];
                      
                      return (
                        <div
                          key={mod.name}
                          draggable={!installed}
                          onDragStart={(e) => handleDragStart(e, mod)}
                          onDragEnd={handleDragEnd}
                          className={`
                            p-3 rounded-lg bg-studio-terminal cyber-border 
                            transition-all duration-200 cursor-grab active:cursor-grabbing
                            ${isDragged ? 'opacity-50 scale-95' : ''}
                            ${installed ? 'border-green-500/50' : 'hover:border-neon-cyan/50'}
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-terminal text-sm matrix-text truncate">
                                  {mod.name}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs font-terminal border-${categoryConfig.color}/30 ${categoryConfig.color}`}
                                >
                                  {mod.version}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground font-terminal mt-1 line-clamp-1">
                                {mod.description}
                              </p>
                            </div>

                            {installed ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemove(mod.name)}
                                className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleInstall(mod)}
                                disabled={installing}
                                className="h-7 px-2 neon-green hover:bg-neon-green/10"
                              >
                                {installing ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Plus className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </Tabs>
            </div>

            {/* Installed packages drop zone */}
            <div 
              className="w-64 flex flex-col"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <h3 className="font-cyber neon-purple text-sm mb-3 flex items-center gap-2">
                <Download className="h-4 w-4" />
                INSTALLED ({installedPackages.length})
              </h3>
              
              <div 
                className={`
                  flex-1 rounded-lg cyber-border bg-studio-terminal/50 p-3
                  transition-colors duration-200
                  ${draggedModule ? 'border-neon-green border-dashed bg-neon-green/5' : ''}
                `}
              >
                {draggedModule && (
                  <div className="text-center py-4 text-sm text-muted-foreground font-terminal">
                    Drop to install
                  </div>
                )}
                
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {installedPackages.length === 0 && !draggedModule && (
                      <p className="text-xs text-muted-foreground font-terminal text-center py-4">
                        Drag modules here to install
                      </p>
                    )}
                    
                    {installedPackages.map((pkg) => (
                      <div
                        key={pkg}
                        className="flex items-center justify-between p-2 rounded bg-studio-header cyber-border"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Check className="h-3 w-3 neon-green flex-shrink-0" />
                          <span className="font-terminal text-xs matrix-text truncate">
                            {pkg}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemove(pkg)}
                          className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </CardContent>

        <div className="p-4 border-t cyber-border flex justify-between items-center">
          <p className="text-xs text-muted-foreground font-terminal">
            Drag modules to the right panel or click + to install
          </p>
          <Button onClick={onClose} className="bg-neon-green text-studio-bg hover:bg-neon-green/90 font-terminal">
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
};
