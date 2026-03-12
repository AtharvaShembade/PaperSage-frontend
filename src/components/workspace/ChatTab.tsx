import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChatMessage, ChatSource } from '@/types';
import { sendChatMessage, pinAnnotation } from '@/services/api';
import { Send, Bot, User, Loader2, BookOpen, ChevronDown, ChevronUp, Bookmark, BookmarkCheck, Plus, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatTabProps {
  projectId: string;
  isActive?: boolean;
  pendingQuery?: string | null;
  onPendingQueryConsumed?: () => void;
}

interface ChatSession {
  id: string;
  name: string;
  createdAt: string;
  messages: ChatMessage[];
}

// ── Storage helpers ──────────────────────────────────────────────────────────

const SESSIONS_KEY = (pid: string) => `chat_sessions_${pid}`;

const WELCOME_MESSAGE = (): ChatMessage => ({
  id: '1',
  role: 'assistant',
  content: "Hello! I'm your research assistant. Ask me anything about the papers in this project. I'll provide answers with citations from your collected research.",
  timestamp: new Date().toISOString(),
});

const newSession = (): ChatSession => ({
  id: Date.now().toString(),
  name: 'New Chat',
  createdAt: new Date().toISOString(),
  messages: [WELCOME_MESSAGE()],
});

function loadSessions(projectId: string): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY(projectId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Migrate old single-chat storage if present
    const legacy = localStorage.getItem(`chat_history_${projectId}`);
    if (legacy) {
      const msgs = JSON.parse(legacy) as ChatMessage[];
      if (msgs.length > 1) {
        const firstUser = msgs.find(m => m.role === 'user');
        return [{
          id: Date.now().toString(),
          name: firstUser ? firstUser.content.slice(0, 28) : 'Chat 1',
          createdAt: msgs[0].timestamp,
          messages: msgs,
        }];
      }
    }
  } catch {}
  return [newSession()];
}

function saveSessions(projectId: string, sessions: ChatSession[]) {
  try { localStorage.setItem(SESSIONS_KEY(projectId), JSON.stringify(sessions)); } catch {}
}

// ── Relative timestamp ───────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── SourceList (unchanged) ───────────────────────────────────────────────────

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
    } catch {} finally {
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
                  : <ChevronDown className="w-3 h-3 text-primary shrink-0 ml-2" />}
              </button>
              {expanded === i && (
                <div className="bg-muted/30">
                  <p className="text-xs text-muted-foreground px-3 pt-2 pb-1 leading-relaxed">{source.chunk}</p>
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
                      {pinning === i ? <Loader2 className="w-3 h-3 animate-spin" />
                        : pinned.has(i) ? <BookmarkCheck className="w-3 h-3" />
                        : <Bookmark className="w-3 h-3" />}
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

// ── Main component ───────────────────────────────────────────────────────────

export function ChatTab({ projectId, isActive, pendingQuery, onPendingQueryConsumed }: ChatTabProps) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions(projectId));
  const [activeId, setActiveId] = useState<string>(() => loadSessions(projectId)[0].id);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeId) ?? sessions[0];
  const messages = activeSession?.messages ?? [];

  // Persist on change
  useEffect(() => {
    saveSessions(projectId, sessions);
  }, [sessions, projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isActive) messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [isActive]);

  useEffect(() => {
    if (pendingQuery && isActive) {
      handleSend(pendingQuery);
      onPendingQueryConsumed?.();
    }
  }, [pendingQuery, isActive]);

  const updateMessages = (id: string, msgs: ChatMessage[]) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, messages: msgs } : s));
  };

  const handleNewSession = () => {
    const s = newSession();
    setSessions(prev => [s, ...prev]);
    setActiveId(s.id);
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== id);
      if (remaining.length === 0) {
        const s = newSession();
        setActiveId(s.id);
        return [s];
      }
      if (id === activeId) setActiveId(remaining[0].id);
      return remaining;
    });
  };

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSend = async (text?: string, deep = false) => {
    const content = text ?? input;
    if (!content.trim() || isLoading) return;

    const currentId = activeId;
    const currentMessages = sessions.find(s => s.id === currentId)?.messages ?? [];

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: deep ? `${content} (deeper analysis)` : content,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...currentMessages, userMessage];

    // Auto-name session from first user message
    const isFirstUserMsg = !currentMessages.some(m => m.role === 'user');
    setSessions(prev => prev.map(s => s.id === currentId ? {
      ...s,
      messages: newMessages,
      name: isFirstUserMsg ? content.slice(0, 30) : s.name,
    } : s));

    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(projectId, content, deep);
      setSessions(prev => prev.map(s =>
        s.id === currentId ? { ...s, messages: [...s.messages, response] } : s
      ));
    } catch (error: any) {
      const status = error?.status;
      const errText = !status
        ? "Couldn't reach the server. Check your connection and try again."
        : status === 401 ? "Your session has expired. Please refresh the page."
        : status === 404 ? "This project could not be found."
        : "Something went wrong on our end. Try again in a moment.";
      setSessions(prev => prev.map(s =>
        s.id === currentId ? {
          ...s,
          messages: [...s.messages, {
            id: Date.now().toString(),
            role: 'assistant',
            content: errText,
            timestamp: new Date().toISOString(),
          }]
        } : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass rounded-xl flex h-[600px] overflow-hidden">

      {/* ── Session Sidebar ── */}
      <div className="w-48 shrink-0 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <button
            onClick={handleNewSession}
            className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg px-3 py-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {sessions.map(session => (
            <div
              key={session.id}
              onMouseEnter={() => setHoveredSessionId(session.id)}
              onMouseLeave={() => setHoveredSessionId(null)}
              onClick={() => setActiveId(session.id)}
              className={`group relative mx-2 mb-1 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                session.id === activeId
                  ? 'bg-primary/10 border-l-2 border-primary'
                  : 'hover:bg-muted/30 border-l-2 border-transparent'
              }`}
            >
              <p className={`text-xs font-medium line-clamp-2 leading-snug pr-4 ${
                session.id === activeId ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {session.name}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                {relativeTime(session.createdAt)}
              </p>
              {hoveredSessionId === session.id && sessions.length > 1 && (
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteSession(session.id); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
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
              onClick={() => updateMessages(activeId, [WELCOME_MESSAGE()])}
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
                  className={`flex gap-3 animate-fade-in ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
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
        <div className="p-4 border-t border-border shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about your research papers..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
              className="bg-muted border-border"
              disabled={isLoading}
            />
            <Button onClick={() => handleSend()} disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
