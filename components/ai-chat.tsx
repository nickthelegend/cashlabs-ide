import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface AIChatProps {
  title: string;
  selectedTemplate?: string;
  activeFile?: string;
  fileContent?: string;
  onFileUpdate?: (filePath: string, content: string) => void;
  onClose?: () => void;
}

interface Message {
  type: 'user' | 'ai';
  text: string;
  isLoading?: boolean;
}

const AIChat: React.FC<AIChatProps> = ({ title, selectedTemplate = "CashScript", activeFile, fileContent, onFileUpdate, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() !== '' && !isLoading) {
      const userMessage = inputMessage;
      const newMessages = [...messages, { type: 'user' as const, text: userMessage }];

      setMessages(newMessages);
      setInputMessage('');
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: newMessages,
            template: selectedTemplate
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setMessages((prev) => [...prev, { type: 'ai', text: data.response }]);
        } else {
          throw new Error(data.error || "Failed to get AI response");
        }
      } catch (error: any) {
        console.error("❌ Chat error:", error);
        setMessages((prev) => [...prev, {
          type: 'ai',
          text: `Error: ${error.message}. Please try again.`
        }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  const markdownComponents = {
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const codeValue = String(children).replace(/\n$/, '');

      return !inline && match ? (
        <div className="code-block-container relative group my-4 rounded-xl overflow-hidden border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--background-color)" }}>
          <div className="flex items-center justify-between px-4 py-2 border-b" style={{ backgroundColor: "var(--sidebar-color)", borderColor: "var(--border-color)" }}>
            <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{match[1]}</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(codeValue);
                  toast({
                    title: "Code copied!",
                    description: "Snippet copied to clipboard.",
                  });
                }}
                className="text-[10px] px-2 py-1 rounded transition-colors border opacity-60 hover:opacity-100"
                style={{ backgroundColor: "var(--background-color)", borderColor: "var(--border-color)" }}
              >
                Copy
              </button>
              {onFileUpdate && (
                <button
                  onClick={() => {
                    if (activeFile) {
                      onFileUpdate(activeFile, codeValue);
                      toast({
                        title: "File Updated",
                        description: `${activeFile} has been updated.`,
                      });
                    } else {
                      toast({
                        title: "No Active File",
                        description: "Please open a file in the editor to apply this code.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className={`text-[10px] px-2 py-1 rounded transition-colors ${activeFile ? "bg-[#238636] hover:bg-[#2ea043] text-white" : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"}`}
                >
                  Apply Code
                </button>
              )}
            </div>
          </div>
          <div className="p-0 overflow-hidden text-sm">
            <SyntaxHighlighter
              language={match[1] === 'cashscript' ? 'javascript' : match[1]}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '1rem',
                backgroundColor: 'transparent',
                fontSize: '0.85rem',
              }}
              codeTagProps={{
                style: {
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                }
              }}
            >
              {codeValue}
            </SyntaxHighlighter>
          </div>
        </div>
      ) : (
        <code className="bg-[#afb8c1]/10 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    p: ({ children }: any) => <p className="mb-4 leading-relaxed last:mb-0 opacity-90">{children}</p>,
    h1: ({ children }: any) => <h1 className="text-xl font-bold mb-4 border-b pb-2" style={{ borderColor: "var(--border-color)" }}>{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-lg font-bold mb-3">{children}</h2>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-4 space-y-1 opacity-90">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-4 space-y-1 opacity-90">{children}</ol>,
    li: ({ children }: any) => <li className="ml-4">{children}</li>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 pl-4 italic opacity-60 my-4" style={{ borderColor: "var(--border-color)" }}>
        {children}
      </blockquote>
    ),
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: "var(--background-color)", color: "var(--text-color)" }}>
      {/* Header */}
      <div className="border-b flex-shrink-0" style={{ backgroundColor: "var(--sidebar-color)", borderColor: "var(--border-color)" }}>
        <div className="h-10 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[10px] py-0 font-bold" style={{ borderColor: "var(--border-color)", opacity: 0.5 }}>
              {selectedTemplate}
            </Badge>
            {onClose && (
              <button
                onClick={onClose}
                className="opacity-40 hover:opacity-100 transition-opacity text-lg"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-4 flex flex-col space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center px-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border shadow-sm" style={{ backgroundColor: "var(--sidebar-color)", borderColor: "var(--border-color)" }}>
                <Sparkles className="w-6 h-6 text-[#d29922]" />
              </div>
              <h2 className="text-lg font-bold mb-2">How can I help you today?</h2>
              <p className="text-xs opacity-40 max-w-[200px] mb-6 uppercase tracking-tight font-medium">
                Optimized for BCH smart contract engineering
              </p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                <button
                  onClick={() => setInputMessage("Create a basic lock contract")}
                  className="text-left px-4 py-2 rounded-xl border text-[10px] uppercase font-bold tracking-tight transition-all hover:translate-x-1"
                  style={{ backgroundColor: "var(--sidebar-color)", borderColor: "var(--border-color)" }}
                >
                  "Create a basic lock contract"
                </button>
                <button
                  onClick={() => setInputMessage("How do I use CashTokens?")}
                  className="text-left px-4 py-2 rounded-xl border text-[10px] uppercase font-bold tracking-tight transition-all hover:translate-x-1"
                  style={{ backgroundColor: "var(--sidebar-color)", borderColor: "var(--border-color)" }}
                >
                  "How do I use CashTokens?"
                </button>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`text-[9px] mb-1 font-black uppercase tracking-[0.1em] ${message.type === 'user' ? 'text-[#5ae6b9]' : 'opacity-30'}`}>
                  {message.type === 'user' ? 'User' : 'CashLabs AI'}
                </div>
                <div
                  className={`max-w-[95%] p-4 rounded-2xl border shadow-sm ${message.type === 'user'
                    ? 'bg-[#0e639c] border-[#1177bb] text-white'
                    : 'text-[#d4d4d4]'
                    }`}
                  style={message.type === 'ai' ? { backgroundColor: "var(--sidebar-color)", borderColor: "var(--border-color)" } : {}}
                >
                  {message.type === 'user' ? (
                    <div className="whitespace-pre-wrap text-sm font-medium">{message.text}</div>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={markdownComponents}
                      >
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex flex-col items-start">
              <div className="text-[9px] mb-1 font-black uppercase tracking-[0.1em] opacity-30">Thinking</div>
              <div className="p-4 rounded-2xl border flex items-center gap-3 shadow-sm" style={{ backgroundColor: "var(--sidebar-color)", borderColor: "var(--border-color)" }}>
                <Loader2 className="w-3 h-3 animate-spin text-[#58a6ff]" />
                <span className="text-[11px] font-bold uppercase tracking-tight opacity-40">Analyzing Knowledge Library...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t" style={{ backgroundColor: "var(--sidebar-color)", borderColor: "var(--border-color)" }}>
        <div className="relative flex items-center">
          <Input
            type="text"
            placeholder="Ask anything..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="w-full pr-12 focus:ring-1 focus:ring-[#5ae6b9] text-xs h-11 rounded-xl border"
            style={{ backgroundColor: "var(--background-color)", borderColor: "var(--border-color)" }}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="absolute right-2 p-2 text-[#5ae6b9] hover:text-[#48d4a6] disabled:opacity-20 transition-all active:scale-90"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[8px] opacity-30 text-center mt-3 uppercase tracking-widest font-black">
          Powered by Mistral AI + CashLabs Semantic Search
        </p>
      </div>
      <Toaster />
    </div>
  );
};

export default AIChat;
