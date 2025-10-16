import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, X, Palette, Type, Keyboard, Zap } from 'lucide-react';

interface SettingsPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const SettingsPanel = ({ isVisible, onClose }: SettingsPanelProps) => {
  const [fontSize, setFontSize] = useState([14]);
  const [tabSize, setTabSize] = useState('2');
  const [theme, setTheme] = useState('cyberpunk');
  const [autoSave, setAutoSave] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [minimap, setMinimap] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-studio-sidebar cyber-border rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col terminal-glow">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b cyber-border bg-studio-header">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 neon-purple pulse-glow" />
            <h2 className="font-cyber text-lg neon-green">MATRIX_CONFIG.SYS</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="neon-purple hover:neon-glow"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid w-full grid-cols-4 cyber-border">
              <TabsTrigger value="appearance" className="font-terminal">
                <Palette className="h-4 w-4 mr-2" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="editor" className="font-terminal">
                <Type className="h-4 w-4 mr-2" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="keybindings" className="font-terminal">
                <Keyboard className="h-4 w-4 mr-2" />
                Keybindings
              </TabsTrigger>
              <TabsTrigger value="advanced" className="font-terminal">
                <Zap className="h-4 w-4 mr-2" />
                Advanced
              </TabsTrigger>
            </TabsList>

            {/* Appearance */}
            <TabsContent value="appearance" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-terminal neon-green">Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="cyber-border bg-studio-terminal matrix-text font-terminal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="cyber-border bg-studio-sidebar">
                      <SelectItem value="cyberpunk" className="font-terminal">Cyberpunk Matrix</SelectItem>
                      <SelectItem value="neon-purple" className="font-terminal">Neon Purple</SelectItem>
                      <SelectItem value="neural-blue" className="font-terminal">Neural Blue</SelectItem>
                      <SelectItem value="quantum-green" className="font-terminal">Quantum Green</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-terminal neon-green">Font Size: {fontSize[0]}px</Label>
                  <Slider
                    value={fontSize}
                    onValueChange={setFontSize}
                    min={10}
                    max={24}
                    step={1}
                    className="cyber-slider"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Editor */}
            <TabsContent value="editor" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-terminal matrix-text">Auto Save</Label>
                  <Switch
                    checked={autoSave}
                    onCheckedChange={setAutoSave}
                    className="cyber-switch"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="font-terminal matrix-text">Show Line Numbers</Label>
                  <Switch
                    checked={lineNumbers}
                    onCheckedChange={setLineNumbers}
                    className="cyber-switch"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="font-terminal matrix-text">Enable Minimap</Label>
                  <Switch
                    checked={minimap}
                    onCheckedChange={setMinimap}
                    className="cyber-switch"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="font-terminal matrix-text">Word Wrap</Label>
                  <Switch
                    checked={wordWrap}
                    onCheckedChange={setWordWrap}
                    className="cyber-switch"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-terminal neon-green">Tab Size</Label>
                  <Select value={tabSize} onValueChange={setTabSize}>
                    <SelectTrigger className="cyber-border bg-studio-terminal matrix-text font-terminal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="cyber-border bg-studio-sidebar">
                      <SelectItem value="2" className="font-terminal">2 spaces</SelectItem>
                      <SelectItem value="4" className="font-terminal">4 spaces</SelectItem>
                      <SelectItem value="8" className="font-terminal">8 spaces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Keybindings */}
            <TabsContent value="keybindings" className="space-y-4 mt-4">
              <div className="cyber-border rounded p-4 bg-studio-terminal space-y-3">
                {[
                  { key: 'Ctrl + S', action: 'Save File' },
                  { key: 'Ctrl + N', action: 'New File' },
                  { key: 'Ctrl + W', action: 'Close Tab' },
                  { key: 'Ctrl + Shift + F', action: 'Search in Files' },
                  { key: 'Ctrl + `', action: 'Toggle Terminal' },
                  { key: 'Alt + ↑/↓', action: 'Move Line' },
                  { key: 'Ctrl + /', action: 'Toggle Comment' },
                  { key: 'F11', action: 'Toggle Fullscreen' }
                ].map((binding, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="matrix-text font-terminal">{binding.action}</span>
                    <span className="neon-green font-terminal cyber-border px-2 py-1 rounded">
                      {binding.key}
                    </span>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Advanced */}
            <TabsContent value="advanced" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="cyber-border rounded p-4 bg-studio-terminal">
                  <h3 className="font-terminal neon-purple mb-3">Performance</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="matrix-text font-terminal">Enable Hardware Acceleration</span>
                      <Switch defaultChecked className="cyber-switch" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="matrix-text font-terminal">Neural Network Optimization</span>
                      <Switch defaultChecked className="cyber-switch" />
                    </div>
                  </div>
                </div>

                <div className="cyber-border rounded p-4 bg-studio-terminal">
                  <h3 className="font-terminal neon-purple mb-3">Experimental Features</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="matrix-text font-terminal">AI Code Suggestions</span>
                      <Switch className="cyber-switch" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="matrix-text font-terminal">Quantum Compiler</span>
                      <Switch className="cyber-switch" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="p-4 border-t cyber-border bg-studio-header flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="cyber-border neon-purple hover:neon-glow font-terminal"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              console.log('[SETTINGS] Configuration saved to neural matrix');
              onClose();
            }}
            className="neon-glow cyber-border font-terminal"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
