import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Package, TestTube, Monitor, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProjectDownloaderProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ProjectDownloader: React.FC<ProjectDownloaderProps> = ({ isVisible, onClose }) => {
  const [projectType, setProjectType] = useState<'react' | 'pc'>('react');
  const [projectName, setProjectName] = useState('MyApp');
  const [version, setVersion] = useState('1.0.0');
  const [offlineCapable, setOfflineCapable] = useState(true);
  const [includeTests, setIncludeTests] = useState(true);
  const [installerType, setInstallerType] = useState<'msi' | 'exe' | 'dmg' | 'deb'>('exe');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  if (!isVisible) return null;

  const handleDownload = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate installer generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const config = {
        type: projectType,
        name: projectName,
        version,
        offlineCapable,
        includeTests,
        installerType: projectType === 'pc' ? installerType : 'zip'
      };

      // Create download blob
      const configBlob = new Blob([JSON.stringify(config, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(configBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}-${projectType}-installer-config.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Ready",
        description: `${projectType.toUpperCase()} installer package generated successfully!`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate installer package",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 bg-card border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Project Installer Generator
          </CardTitle>
          <CardDescription>
            Generate installers for PC applications or React web apps with offline capabilities
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-type">Project Type</Label>
              <Select value={projectType} onValueChange={(value: 'react' | 'pc') => setProjectType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="react">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      React Web App
                    </div>
                  </SelectItem>
                  <SelectItem value="pc">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      PC Desktop App
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
              />
            </div>

            {projectType === 'pc' && (
              <div className="space-y-2">
                <Label htmlFor="installer-type">Installer Type</Label>
                <Select value={installerType} onValueChange={(value: any) => setInstallerType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exe">Windows (.exe)</SelectItem>
                    <SelectItem value="msi">Windows Installer (.msi)</SelectItem>
                    <SelectItem value="dmg">macOS (.dmg)</SelectItem>
                    <SelectItem value="deb">Linux (.deb)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="offline"
                checked={offlineCapable}
                onCheckedChange={(checked) => setOfflineCapable(!!checked)}
              />
              <Label htmlFor="offline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Enable Offline Capabilities
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="tests"
                checked={includeTests}
                onCheckedChange={(checked) => setIncludeTests(!!checked)}
              />
              <Label htmlFor="tests" className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Include Full Testing Suite
              </Label>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleDownload} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Installer
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};