import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Demo fetch method — replace with your actual GodBot query logic
async function fetchGodbotReply(prompt: string, apiKey: string) {
  const url = "/api/godbot";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey && apiKey !== "DEFAULT"
        ? { "X-GODBOT-API-KEY": apiKey }
        : {}), // Pass API key only if in custom mode
    },
    body: JSON.stringify({ msg: prompt, keyMode: apiKey }), // Pass mode to backend if needed
  });
  const data = await res.json();
  return data.reply;
}

interface StudioApiKeySelectorProps {
  onKeyChange?: (key: string) => void;
}

export default function StudioApiKeySelector({ onKeyChange }: StudioApiKeySelectorProps) {
  const [mode, setMode] = useState("default");
  const [customKey, setCustomKey] = useState("");
  const [demoPrompt, setDemoPrompt] = useState("");
  const [demoReply, setDemoReply] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mode === "default") {
      onKeyChange && onKeyChange("DEFAULT");
    } else if (mode === "custom" && customKey.trim() !== "") {
      onKeyChange && onKeyChange(customKey.trim());
    }
  }, [mode, customKey, onKeyChange]);

  const handleDemoQuery = async () => {
    if (!demoPrompt.trim()) return;
    
    setDemoReply(null);
    setIsLoading(true);
    
    try {
      const result = await fetchGodbotReply(demoPrompt, mode === "custom" ? customKey : "DEFAULT");
      setDemoReply(result);
    } catch (error) {
      setDemoReply("Error: Backend API not available. Connect to Supabase to enable API functionality.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>AI API Key Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mode-select">API Key Mode</Label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger>
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Use Default GodBot AI (built-in)</SelectItem>
              <SelectItem value="custom">Use My Own API Key</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {mode === "custom" && (
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your API key"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="demo-prompt">Demo: Ask GodBot anything</Label>
          <Input
            id="demo-prompt"
            type="text"
            placeholder="Enter your prompt or question"
            value={demoPrompt}
            onChange={(e) => setDemoPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleDemoQuery()}
          />
        </div>

        <Button 
          onClick={handleDemoQuery} 
          disabled={!demoPrompt.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? "Sending..." : "Send to GodBot"}
        </Button>

        {demoReply && (
          <Card className="mt-4">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <Label className="font-semibold">GodBot Response:</Label>
                <div className="p-3 rounded bg-muted text-sm">
                  <pre className="whitespace-pre-wrap font-mono">{demoReply}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}