import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChatMessage, ChatSource } from '@/types';
import { sendChatMessage } from '@/services/api';
import { Send, Bot, User, Loader2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface ChatTabProps {
  projectId: string;
}

function SourceList({ sources }: { sources: ChatSource[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
      <p className="text-xs text-muted-foreground mb-2">Sources:</p>
      {sources.map((source, i) => (
        <div key={i} className="rounded-lg overflow-hidden border border-border/40">
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-primary/10 hover:bg-primary/20 transition-colors text-left"
          >
            <span className="text-xs text-primary font-medium line-clamp-1">{source.title}</span>
            {expanded === i
              ? <ChevronUp className="w-3 h-3 text-primary shrink-0 ml-2" />
              : <ChevronDown className="w-3 h-3 text-primary shrink-0 ml-2" />
            }
          </button>
          {expanded === i && (
            <p className="text-xs text-muted-foreground px-3 py-2 leading-relaxed bg-muted/30">
              {source.chunk}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

const STORAGE_KEY = (projectId: string) => `chat_history_${projectId}`;

const WELCOME_MESSAGE: ChatMessage = {
  id: '1',
  role: 'assistant',
  content: "Hello! I'm your research assistant. Ask me anything about the papers in this project. I'll provide answers with citations from your collected research.",
  timestamp: new Date().toISOString()
};

export function ChatTab({ projectId }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY(projectId));
      return saved ? JSON.parse(saved) : [WELCOME_MESSAGE];
    } catch {
      return [WELCOME_MESSAGE];
    }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY(projectId), JSON.stringify(messages));
    } catch {}
  }, [messages, projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const content = text ?? input;
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(projectId, content);
      setMessages(prev => [...prev, response]);
    } catch (error: any) {
      const status = error?.status;
      const text =
        !status
          ? "Couldn't reach the server. Check your connection and try again."
          : status === 401
          ? "Your session has expired. Please refresh the page."
          : status === 404
          ? "This project could not be found."
          : "Something went wrong on our end. Try again in a moment.";

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: text,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass rounded-xl flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Research Assistant</h2>
            <p className="text-sm text-muted-foreground">Ask questions about your papers</p>
          </div>
        </div>
        {messages.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setMessages([WELCOME_MESSAGE])}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={message.id}>
            <div
              className={`flex gap-3 animate-fade-in ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}

              <div className={`max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
                  : 'glass rounded-2xl rounded-bl-md'
              } px-4 py-3`}>
                <p className={message.role === 'user' ? 'text-primary-foreground' : 'text-foreground'}>
                  {message.content}
                </p>

                {message.sources && message.sources.length > 0 && (
                  <SourceList sources={message.sources} />
                )}
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>

            {message.role === 'assistant' && message.follow_ups && message.follow_ups.length > 0 && (
              <div className="ml-11 mt-2 flex flex-col gap-1.5">
                {message.follow_ups.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="text-left text-xs text-muted-foreground hover:text-primary border border-border/50 hover:border-primary/40 rounded-lg px-3 py-1.5 transition-colors bg-muted/20 hover:bg-primary/5"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 items-center animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="glass rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about your research papers..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
            className="bg-muted border-border"
            disabled={isLoading}
          />
          <Button onClick={() => handleSend()} disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
