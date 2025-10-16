import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Copy, ThumbsUp, ThumbsDown, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { validateMessage, RateLimiter } from "@/lib/inputValidation";
import { z } from "zod";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '✨ **Lady Violet Online** - Creative Dev Companion Activated\n\nHello darling! I\'m Lady Violet, your AI design and development partner powered by free Gemini AI. I specialize in creating beautiful, functional experiences!\n\n**What I can do:**\n• Design stunning UI/UX with cyberpunk aesthetics\n• Write production-ready React, TypeScript, and Node.js code\n• Create responsive, accessible interfaces\n• Implement smooth animations and interactions\n• Optimize performance and user experience\n• Guide you through the creative process\n\n**Let\'s create something beautiful together!** What\'s your vision?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const rateLimiterRef = useRef(new RateLimiter(2000));

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    // Validate input
    try {
      validateMessage(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return;
    }

    // Check rate limit
    if (!rateLimiterRef.current.checkLimit()) {
      const remaining = Math.ceil(rateLimiterRef.current.getRemainingTime() / 1000);
      toast.error(`Please wait ${remaining} seconds before sending another message`);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lady-violet-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: updatedMessages.map(m => ({
              role: m.role,
              content: m.content
            }))
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get AI response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      if (reader) {
        let buffer = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith(":")) continue;
            if (!line.startsWith("data: ")) continue;

            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                assistantMessage.content += content;
                setMessages(prev => 
                  prev.map((m, i) => 
                    i === prev.length - 1 ? { ...assistantMessage } : m
                  )
                );
              }
              } catch (e) {
                // Silently ignore parsing errors for streaming chunks
              }
          }
        }
      }

      setIsTyping(false);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `[NEURAL_ERROR] ${error instanceof Error ? error.message : "Connection to AI failed"}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error("Failed to send message. Please try again.");
      setIsTyping(false);
    }
  };

  const generateCyberpunkAIResponse = (userInput: string) => {
    if (userInput.toLowerCase().includes('button') || userInput.toLowerCase().includes('component')) {
      return `[NEURAL_SYNTHESIS] Compiling cyberpunk button component...\n\n\`\`\`tsx\nimport { Button } from '@/components/ui/button';\n\nconst CyberButton = () => {\n  return (\n    <Button \n      className="neon-glow pulse-glow cyber-border"\n      onClick={() => console.log('Neural link activated!')}\n    >\n      <Zap className="h-4 w-4 mr-2 neon-green" />\n      Execute Command\n    </Button>\n  );\n};\n\`\`\`\n\n[OK] Component manifested with neon aesthetics and quantum animations. Ready for integration into the matrix.`;
    }
    
    if (userInput.toLowerCase().includes('app') || userInput.toLowerCase().includes('build')) {
      return `[QUANTUM_COMPILER] Analyzing project requirements...\n\n**CYBERPUNK APP GENERATOR**\n\n🔹 **Neural Web Apps**\n• Matrix-themed React components\n• Holographic UI elements\n• Quantum state management\n\n🔹 **Desktop Applications**\n• Electron-powered cyber apps\n• Native OS integration protocols\n• Auto-updater neural networks\n\n🔹 **Installation Packages**\n• Windows MSI quantum packages\n• macOS DMG neural containers\n• Linux AppImage cyber-binaries\n\n[AI_PROMPT] Specify your target platform and I will initiate the compilation sequence.`;
    }

    if (userInput.toLowerCase().includes('cyberpunk') || userInput.toLowerCase().includes('theme')) {
      return `[AESTHETIC_PROCESSOR] Deploying cyberpunk visual enhancements...\n\n**MATRIX THEME SYSTEM**\n\n🟢 **Neon Color Palette**\n• Matrix green (--neon-green): Primary neural interface\n• Cyber purple (--neon-purple): Secondary quantum channels\n• Terminal cyan (--neon-cyan): Data stream indicators\n\n🟣 **Visual Effects**\n• .neon-glow - Quantum illumination\n• .pulse-glow - Neural pulse animation\n• .cyber-border - Matrix boundary styling\n• .flicker - Holographic instability\n\n🔵 **Typography**\n• JetBrains Mono - Terminal interface font\n• Orbitron - Cyberpunk display headers\n\n[OK] Aesthetic matrix fully deployed. Your application now radiates with pure cyber energy.`;
    }

    return `[NEURAL_PROCESSING] Analyzing input: "${userInput}"\n\n[AI_CORE] I understand your request. Let me interface with the quantum processors to manifest your requirements.\n\n**PROCESSING PARAMETERS:**\n• Input classification: SUCCESSFUL\n• Neural pathway: ACTIVE\n• Quantum entanglement: STABLE\n\n[REQUEST] Please provide additional specifications:\n• Target implementation details\n• Preferred aesthetic enhancements\n• Integration requirements\n\nI will generate the optimal code solution for integration into the matrix.`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-studio-sidebar terminal-glow">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b cyber-border bg-studio-header">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 neon-purple pulse-glow" />
          <h3 className="font-cyber font-semibold neon-green">NEURAL_NET.AI</h3>
        </div>
        <Badge variant="secondary" className="bg-green-500/20 neon-green border-green-500/30 font-terminal">
          <Sparkles className="h-3 w-3 mr-1 flicker" />
          QUANTUM_ONLINE
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 cyber-scrollbar">
        <div className="space-y-4">
          {messages.map(message => (
            <div key={message.id} className="space-y-2">
              <div className="flex items-center space-x-2">
                {message.role === 'user' ? (
                  <User className="h-4 w-4 neon-green" />
                ) : (
                  <Bot className="h-4 w-4 neon-purple" />
                )}
                <span className="text-sm font-cyber font-medium">
                  {message.role === 'user' ? 'USER_001' : 'SYSTEM_AI'}
                </span>
                <span className="text-xs matrix-text font-terminal">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              
              <div className={`p-3 rounded-lg cyber-border ${
                message.role === 'user' 
                  ? 'bg-primary/10 neon-glow' 
                  : 'bg-muted/20 terminal-glow'
              }`}>
                <pre className="whitespace-pre-wrap text-sm font-terminal matrix-text">
                  {message.content}
                </pre>
              </div>
              
              {message.role === 'assistant' && (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="h-6 px-2 neon-green hover:neon-glow">
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 px-2 neon-purple hover:neon-glow">
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 px-2 neon-green hover:neon-glow">
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4 neon-purple pulse-glow" />
                <span className="text-sm font-cyber font-medium">SYSTEM_AI</span>
                <Badge variant="secondary" className="text-xs neon-purple font-terminal">neural_processing...</Badge>
              </div>
              <div className="p-3 rounded-lg cyber-border bg-muted/20 terminal-glow">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 neon-green rounded-full animate-bounce" />
                  <div className="w-2 h-2 neon-purple rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 neon-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t cyber-border bg-studio-terminal">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Input neural commands or natural language queries..."
            className="flex-1 cyber-border bg-studio-terminal matrix-text font-terminal placeholder:text-muted-foreground"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || isTyping}
            size="sm"
            className="neon-glow pulse-glow"
          >
            <Send className="h-4 w-4 neon-green" />
          </Button>
        </div>
        <p className="text-xs matrix-text mt-2 font-terminal">
          Neural Interface Active | Enter: Send | Shift+Enter: New Line
        </p>
      </div>
    </div>
  );
};