import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Bot, User, Copy, ThumbsUp, ThumbsDown, Sparkles, Zap, LogIn, Lock, GitBranch, Loader2, Trash2, FileSearch, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { validateMessage, RateLimiter } from "@/lib/inputValidation";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CodebaseAnalyzer } from "./CodebaseAnalyzer";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatPanelProps {
  onProjectCreated?: (projectId: string) => Promise<void>;
  currentProjectId?: string;
  fileContents?: Record<string, string>;
}

// Extract GitHub repo URL from message
const extractRepoUrl = (message: string): string | null => {
  const match = message.match(/https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/);
  return match ? match[0] : null;
};

// Check if message is an agentic command
const isAgenticCommand = (message: string): boolean => {
  const lower = message.toLowerCase();
  const hasGitHubUrl = extractRepoUrl(message) !== null;
  const hasBuildIntent = 
    lower.includes('build this') ||
    lower.includes('clone this') ||
    lower.includes('scaffold') ||
    lower.includes('import this') ||
    lower.includes('fetch this') ||
    lower.includes('pull this') ||
    lower.includes('create from');
  
  return hasGitHubUrl && (hasBuildIntent || !lower.includes('?'));
};

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: '✨ **Lady Violet Online** - Agentic Dev Companion Activated\n\nHello darling! I\'m Lady Violet, your AI design and development partner.\n\n**🔮 Agentic Capabilities:**\n• **Clone GitHub repos** - Just paste a URL and say "Build this"\n• Design stunning UI/UX with cyberpunk aesthetics\n• Write production-ready React, TypeScript, and Node.js code\n• Create responsive, accessible interfaces\n• Implement smooth animations and interactions\n\n**Example Commands:**\n• `Build this https://github.com/user/repo`\n• `Clone https://github.com/user/repo`\n• `Create a cyberpunk login page`\n\n**Let\'s create something beautiful together!** What\'s your vision?',
  timestamp: new Date()
};

export const AIChatPanel = ({ onProjectCreated, currentProjectId, fileContents = {} }: AIChatPanelProps) => {
  const { session, user, isAuthenticated, isDevBypass } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const rateLimiterRef = useRef(new RateLimiter(2000));
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isCloning, scrollToBottom]);

  // Load chat history from database
  const loadChatHistory = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_id', currentProjectId || null)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map((msg) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at || Date.now())
        }));
        setMessages([WELCOME_MESSAGE, ...loadedMessages]);
      }
    } catch (err) {
      console.error('[Chat] Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?.id, currentProjectId]);

  // Load history on mount and when project changes
  useEffect(() => {
    if (isAuthenticated && !isDevBypass) {
      loadChatHistory();
    }
  }, [isAuthenticated, isDevBypass, loadChatHistory]);

  // Save message to database
  const saveMessage = useCallback(async (message: Message) => {
    if (!user?.id || isDevBypass) return;

    try {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        project_id: currentProjectId || null,
        role: message.role,
        content: message.content
      });
    } catch (err) {
      console.error('[Chat] Failed to save message:', err);
    }
  }, [user?.id, currentProjectId, isDevBypass]);

  // Clear chat history
  const clearHistory = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id)
        .eq('project_id', currentProjectId || null);

      if (error) throw error;

      setMessages([WELCOME_MESSAGE]);
      toast.success('Chat history cleared');
    } catch (err) {
      console.error('[Chat] Failed to clear history:', err);
      toast.error('Failed to clear history');
    }
  }, [user?.id, currentProjectId]);

  // Handle GitHub clone action
  const handleGitHubClone = async (repoUrl: string): Promise<{ success: boolean; projectId?: string; message: string }> => {
    try {
      const authToken = session?.access_token;
      if (!authToken) {
        return { success: false, message: 'Authentication required for cloning' };
      }

      const response = await supabase.functions.invoke('github-clone', {
        body: { repoUrl }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Clone failed');
      }

      return {
        success: true,
        projectId: response.data.projectId,
        message: response.data.message || `Successfully cloned ${response.data.fileCount} files`
      };
    } catch (error) {
      console.error('GitHub clone error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Clone failed'
      };
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping || isCloning) return;

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
    saveMessage(userMessage);
    const currentInput = input;
    setInput('');

    // Check for agentic GitHub clone command
    const repoUrl = extractRepoUrl(currentInput);
    if (repoUrl && isAgenticCommand(currentInput)) {
      setIsCloning(true);

      // Add immediate response
      const cloningMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🔮 **Initiating Neural Clone Sequence**\n\n💾 Connecting to GitHub matrix...\n📡 Repository detected: \`${repoUrl}\`\n⚡ Downloading files into the system...\n\n*Please wait while I materialize your project, darling...*`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, cloningMessage]);

      // Execute the clone
      const result = await handleGitHubClone(repoUrl);

      // Update with result
      const resultMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: result.success
          ? `✅ **Clone Complete!**\n\n${result.message}\n\n🌱 Your project has been lovingly planted in our file system, my love. You can find it in the Project Manager.\n\n**What's next?**\n• Open the project from the sidebar\n• Explore the file tree\n• Let me know what you'd like to modify!`
          : `❌ **Clone Failed**\n\n${result.message}\n\n*Don't worry darling, let's try again or check if the repository is accessible.*`,
        timestamp: new Date()
      };

      setMessages(prev => {
        // Replace the cloning message with result
        const withoutCloning = prev.slice(0, -1);
        return [...withoutCloning, resultMessage];
      });
      saveMessage(resultMessage);

      // Load the project if successful
      if (result.success && result.projectId && onProjectCreated) {
        try {
          await onProjectCreated(result.projectId);
          toast.success('Project loaded successfully!');
        } catch (err) {
          console.error('Failed to load cloned project:', err);
        }
      }

      setIsCloning(false);
      return;
    }

    // Regular AI chat flow
    setIsTyping(true);

    try {
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lady-violet-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
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
              if (import.meta.env.DEV) {
                console.error("Error parsing streaming chunk:", e);
              }
            }
          }
        }

        // Save the complete assistant message
        saveMessage(assistantMessage);
      }

      setIsTyping(false);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error sending message:", error);
      }
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  // Check if user is authenticated
  const canUseAI = isAuthenticated || isDevBypass;

  return (
    <div className="flex flex-col h-full bg-studio-sidebar terminal-glow">
      {/* Header with Tabs */}
      <div className="border-b cyber-border bg-studio-header">
        <div className="flex items-center justify-between p-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between w-full">
              <TabsList className="bg-transparent h-8">
                <TabsTrigger 
                  value="chat" 
                  className="data-[state=active]:bg-primary/20 data-[state=active]:neon-green px-3 py-1 text-xs font-terminal"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  CHAT
                </TabsTrigger>
                <TabsTrigger 
                  value="analyzer" 
                  className="data-[state=active]:bg-primary/20 data-[state=active]:neon-purple px-3 py-1 text-xs font-terminal"
                >
                  <FileSearch className="h-3 w-3 mr-1" />
                  ANALYZER
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                {isLoadingHistory && activeTab === 'chat' && (
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-terminal text-xs">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    LOADING
                  </Badge>
                )}
                {isCloning && (
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-terminal animate-pulse text-xs">
                    <GitBranch className="h-3 w-3 mr-1" />
                    CLONING
                  </Badge>
                )}
                {canUseAI && messages.length > 1 && activeTab === 'chat' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="h-6 px-2 text-muted-foreground hover:text-red-400"
                    title="Clear chat history"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
                <Badge variant="secondary" className={`border-green-500/30 font-terminal text-xs ${canUseAI ? 'bg-green-500/20 neon-green' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                  <Sparkles className="h-3 w-3 mr-1 flicker" />
                  {canUseAI ? 'ONLINE' : 'AUTH'}
                </Badge>
              </div>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Auth Required Message */}
      {!canUseAI ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
          <div className="relative">
            <Lock className="h-16 w-16 neon-purple pulse-glow" />
            <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="font-cyber text-xl neon-purple">Neural Interface Locked</h3>
            <p className="font-terminal text-sm matrix-text max-w-sm">
              Authentication required to activate the AI neural network. Connect to the matrix to unlock Lady Violet.
            </p>
          </div>

          <div className="space-y-3">
            <Link to="/auth">
              <Button className="neon-glow pulse-glow font-cyber w-full" size="lg">
                <LogIn className="h-5 w-5 mr-2" />
                Log In to Activate
              </Button>
            </Link>
            <p className="text-xs matrix-text text-center font-terminal">
              New to the matrix? Sign up for free access.
            </p>
          </div>

          <div className="mt-8 p-4 bg-studio-terminal rounded-lg cyber-border max-w-sm">
            <p className="text-xs font-terminal matrix-text text-center">
              <span className="neon-green">TIP:</span> Once authenticated, you'll have access to Lady Violet AI, terminal commands, and all neural processing features.
            </p>
          </div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 flex flex-col m-0 min-h-0 data-[state=inactive]:hidden">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4 cyber-scrollbar" ref={scrollRef}>
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
                    
                    {message.role === 'assistant' && message.id !== 'welcome' && (
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 neon-green hover:neon-glow"
                          onClick={() => copyMessage(message.content)}
                        >
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

                {isCloning && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <GitBranch className="h-4 w-4 neon-purple pulse-glow" />
                      <span className="text-sm font-cyber font-medium">CLONE_AGENT</span>
                      <Badge variant="secondary" className="text-xs text-purple-400 font-terminal animate-pulse">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        cloning_repo...
                      </Badge>
                    </div>
                    <div className="p-3 rounded-lg cyber-border bg-purple-500/10 terminal-glow">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 neon-purple animate-spin" />
                        <span className="text-sm font-terminal matrix-text">Materializing files from the GitHub matrix...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t cyber-border bg-studio-terminal">
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Paste GitHub URL or enter neural commands..."
                  className="flex-1 cyber-border bg-studio-terminal matrix-text font-terminal placeholder:text-muted-foreground"
                  disabled={isCloning}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!input.trim() || isTyping || isCloning}
                  size="sm"
                  className="neon-glow pulse-glow"
                >
                  {isCloning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 neon-green" />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Analyzer Tab */}
          <TabsContent value="analyzer" className="flex-1 m-0 overflow-auto data-[state=inactive]:hidden">
            <ScrollArea className="h-full">
              <CodebaseAnalyzer 
                fileContents={fileContents} 
                projectId={currentProjectId} 
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AIChatPanel;
