import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChatMessage, ChatSource } from '@/types';
import { sendChatMessage, pinAnnotation } from '@/services/api';
import { Send, Bot, User, Loader2, BookOpen, ChevronDown, ChevronUp, Bookmark, BookmarkCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatTabProps {
  projectId: string;
  isActive?: boolean;
  pendingQuery?: string | null;
  onPendingQueryConsumed?: () => void;
}

function SourceList({ sources, projectId }: { sources: ChatSource[]; projectId: string }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [pinned, setPinned] = useState<Set<number>>(new Set());
  const [pinning, setPinning] = useState<number | null>(null);

  const handlePin = async (i: number, source: ChatSource) => {
    if (pinned.has(i) || pinning === i) return;
    setPinning(i);
    try {
      await pinAnnotation(projectId, source.title, source.chunk);
      setPinned(prev => new Set(prev).add(i));
    } catch {
      // silently fail — backend not wired yet
    } finally {
      setPinning(null);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Sources ({sources.length})
      </button>
      {open && (
        <div className="mt-2 space-y-1">
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
                <div className="bg-muted/30">
                  <p className="text-xs text-muted-foreground px-3 pt-2 pb-1 leading-relaxed">
                    {source.chunk}
                  </p>
                  <div className="px-3 pb-2 flex justify-end">
                    <button
                      onClick={() => handlePin(i, source)}
                      disabled={pinned.has(i) || pinning === i}
                      className={`flex items-center gap-1 text-xs rounded-full px-2.5 py-1 transition-colors ${
                        pinned.has(i)
                          ? 'text-primary bg-primary/10 cursor-default'
                          : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                      }`}
                    >
                      {pinning === i ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : pinned.has(i) ? (
                        <BookmarkCheck className="w-3 h-3" />
                      ) : (
                        <Bookmark className="w-3 h-3" />
                      )}
                      {pinned.has(i) ? 'Pinned' : 'Pin to notes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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

export function ChatTab({ projectId, isActive, pendingQuery, onPendingQueryConsumed }: ChatTabProps) {
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
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY(projectId), JSON.stringify(messages));
    } catch {}
  }, [messages, projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isActive) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [isActive]);

  useEffect(() => {
    if (pendingQuery && isActive) {
      handleSend(pendingQuery);
      onPendingQueryConsumed?.();
    }
  }, [pendingQuery, isActive]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (text?: string, deep = false) => {
    const content = text ?? input;
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: deep ? `${content} (deeper analysis)` : content,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(projectId, content, deep);
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
      <div className="relative flex-1 overflow-hidden">
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/80 transition-colors"
        >
          <ChevronDown className="w-4 h-4 text-primary-foreground" />
        </button>
      )}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="h-full overflow-y-auto p-4 space-y-4">
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
                {message.role === 'user' ? (
                  <p className="text-primary-foreground">{message.content}</p>
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none text-foreground [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_strong]:text-foreground [&_p]:mb-2 last:[&_p]:mb-0">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}

                {message.sources && message.sources.length > 0 && (
                  <SourceList sources={message.sources} projectId={projectId} />
                )}
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>

            {message.role === 'assistant' && message.id !== '1' && (
              <div className="ml-11 mt-2 flex flex-col gap-2">
                {message.follow_ups && message.follow_ups.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {message.follow_ups.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(q)}
                        className="text-xs text-muted-foreground hover:text-primary border border-border/50 hover:border-primary/40 rounded-full px-3 py-1 transition-colors bg-muted/20 hover:bg-primary/5"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                {message.sources && message.sources.length > 0 && (
                  <div>
                    <button
                      onClick={() => handleSend(
                        messages.slice(0, messages.indexOf(message)).filter(m => m.role === 'user').at(-1)?.content ?? '',
                        true
                      )}
                      className="text-xs text-primary hover:text-primary/80 border border-primary/30 hover:border-primary/60 rounded-full px-3 py-1 transition-colors bg-primary/5 hover:bg-primary/10 font-medium"
                    >
                      ↓ Go deeper
                    </button>
                  </div>
                )}
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
