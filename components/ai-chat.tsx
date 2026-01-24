import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Sparkles, Send, Loader2 } from "lucide-react";

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
        <div className="code-block-container relative group my-4 rounded-xl overflow-hidden border border-[#30363d] bg-[#0d1117]">
          <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
            <span className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">{match[1]}</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(codeValue);
                  toast({
                    title: "Code copied!",
                    description: "Snippet copied to clipboard.",
                  });
                }}
                className="text-[10px] px-2 py-1 bg-[#21262d] hover:bg-[#30363d] rounded text-[#c9d1d9] transition-colors border border-[#30363d]"
              >
                Copy
              </button>
              {onFileUpdate && activeFile && (
                <button
                  onClick={() => {
                    onFileUpdate(activeFile, codeValue);
                    toast({
                      title: "File Updated",
                      description: `${activeFile} has been updated.`,
                    });
                  }}
                  className="text-[10px] px-2 py-1 bg-[#238636] hover:bg-[#2ea043] rounded text-white transition-colors"
                >
                  Apply Code
                </button>
              )}
            </div>
          </div>
          <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        </div>
      ) : (
        <code className="bg-[#afb8c1]/20 px-1.5 py-0.5 rounded text-sm font-mono text-[#c9d1d9]" {...props}>
          {children}
        </code>
      );
    },
    p: ({ children }: any) => <p className="mb-4 text-[#c9d1d9] leading-relaxed last:mb-0">{children}</p>,
    h1: ({ children }: any) => <h1 className="text-xl font-bold mb-4 text-white border-b border-[#30363d] pb-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-lg font-bold mb-3 text-white">{children}</h2>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-4 space-y-1 text-[#c9d1d9]">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-4 space-y-1 text-[#c9d1d9]">{children}</ol>,
    li: ({ children }: any) => <li className="ml-4">{children}</li>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-[#30363d] pl-4 italic text-[#8b949e] my-4">
        {children}
      </blockquote>
    ),
  };

  return (
    <div className="h-full flex flex-col bg-[#0d1117] text-[#c9d1d9]">
      <div className="bg-[#161b22] border-b border-[#30363d] flex-shrink-0">
        <div className="h-10 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8b949e]">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e] py-0">
              {selectedTemplate}
            </Badge>
            {onClose && (
              <button
                onClick={onClose}
                className="text-[#8b949e] hover:text-white transition-colors text-lg"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className="p-4 flex flex-col space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center px-6">
              <div className="w-12 h-12 rounded-full bg-[#161b22] flex items-center justify-center mb-4 border border-[#30363d]">
                <Sparkles className="w-6 h-6 text-[#d29922]" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">How can I help you today?</h2>
              <p className="text-sm text-[#8b949e] max-w-xs mb-6">
                I can help you build smart contracts, audit security, or explain CashScript concepts.
              </p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                <button
                  onClick={() => setInputMessage("Create a basic lock contract")}
                  className="text-left px-4 py-2 rounded-lg border border-[#30363d] bg-[#161b22] text-xs hover:border-[#58a6ff] transition-colors"
                >
                  "Create a basic lock contract"
                </button>
                <button
                  onClick={() => setInputMessage("How do I use CashTokens?")}
                  className="text-left px-4 py-2 rounded-lg border border-[#30363d] bg-[#161b22] text-xs hover:border-[#58a6ff] transition-colors"
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
                <div className={`text-[10px] mb-1 font-bold uppercase tracking-widest ${message.type === 'user' ? 'text-[#58a6ff]' : 'text-[#8b949e]'}`}>
                  {message.type === 'user' ? 'You' : 'CashLabs AI'}
                </div>
                <div
                  className={`max-w-[95%] p-4 rounded-2xl ${message.type === 'user'
                    ? 'bg-[#0969da] text-white shadow-lg'
                    : 'bg-[#161b22] text-[#c9d1d9] border border-[#30363d] shadow-xl'
                    }`}
                >
                  {message.type === 'user' ? (
                    <div className="whitespace-pre-wrap text-sm">{message.text}</div>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw, rehypeHighlight]}
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
              <div className="text-[10px] mb-1 font-bold uppercase tracking-widest text-[#8b949e]">Thinking</div>
              <div className="bg-[#161b22] p-4 rounded-2xl border border-[#30363d] flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-[#58a6ff]" />
                <span className="text-sm text-[#8b949e]">Analyzing context and generating code...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 bg-[#161b22] border-t border-[#30363d]">
        <div className="relative flex items-center">
          <Input
            type="text"
            placeholder="Ask about BCH development..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="w-full pr-12 bg-[#0d1117] border-[#30363d] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] text-sm h-11 rounded-xl"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="absolute right-2 p-2 text-[#58a6ff] hover:text-[#79c0ff] disabled:text-[#30363d] transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-[#8b949e] text-center mt-3 uppercase tracking-tighter">
          AI can make mistakes. Verify important code.
        </p>
      </div>
      <Toaster />
    </div>
  );
};

export default AIChat;
