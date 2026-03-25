import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChatMessage, ChatSession, ChatSource } from '@/types';
import { streamChatMessage, pinAnnotation, fetchChatSessions, createChatSession, updateChatSession, deleteChatSession } from '@/services/api';
import { Send, Loader2, BookOpen, ChevronDown, ChevronUp, Bookmark, BookmarkCheck, Plus, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatTabProps {
  projectId: string;
  isActive?: boolean;
  pendingQuery?: string | null;
  onPendingQueryConsumed?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const WELCOME_MESSAGE = (): ChatMessage => ({
  id: '1',
  role: 'assistant',
  content: "Hello! I'm your research assistant. Ask me anything about the papers in this project. I'll provide answers with citations from your collected research.",
  timestamp: new Date().toISOString(),
});

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
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<'searching' | 'generating'>('searching');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [hoveredSessionId, setHoveredSessionId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeId) ?? sessions[0] ?? null;
  const messages: ChatMessage[] = activeSession
    ? (activeSession.messages.length > 0 ? activeSession.messages : [WELCOME_MESSAGE()])
    : [];

  // Load sessions from DB on mount / project change
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setSessionsLoading(true);
      try {
        let data = await fetchChatSessions(projectId);
        if (data.length === 0) {
          const s = await createChatSession(projectId);
          data = [s];
        }
        if (!cancelled) {
          setSessions(data);
          setActiveId(data[0].id);
        }
      } catch {} finally {
        if (!cancelled) setSessionsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [projectId]);

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

  const handleNewSession = async () => {
    try {
      const s = await createChatSession(projectId);
      setSessions(prev => [s, ...prev]);
      setActiveId(s.id);
    } catch {}
  };

  const handleDeleteSession = async (id: number) => {
    try {
      await deleteChatSession(id);
      setSessions(prev => {
        const remaining = prev.filter(s => s.id !== id);
        if (id === activeId && remaining.length > 0) setActiveId(remaining[0].id);
        return remaining;
      });
      // If deleted last session, create a new one
      setSessions(prev => {
        if (prev.length === 0) {
          createChatSession(projectId).then(s => {
            setSessions([s]);
            setActiveId(s.id);
          });
        }
        return prev;
      });
    } catch {}
  };

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSend = async (text?: string, deep = false) => {
    const content = text ?? input;
    if (!content.trim() || isLoading || !activeSession) return;

    const currentSessionId = activeSession.id;
    const currentMessages: ChatMessage[] = activeSession.messages.length > 0
      ? activeSession.messages
      : [WELCOME_MESSAGE()];

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: deep ? `${content} (deeper analysis)` : content,
      timestamp: new Date().toISOString(),
    };

    const isFirstUserMsg = !currentMessages.some(m => m.role === 'user');
    const newName = isFirstUserMsg ? content.slice(0, 30) : activeSession.name;
    const messagesWithUser = [...currentMessages.filter(m => m.id !== '1'), userMessage];

    setSessions(prev => prev.map(s => s.id === currentSessionId
      ? { ...s, messages: messagesWithUser, name: newName }
      : s
    ));
    setInput('');
    setIsLoading(true);
    setLoadingStatus('searching');

    const assistantMsgId = (Date.now() + 1).toString();
    let streamStarted = false;

    try {
      const response = await streamChatMessage(projectId, content, deep);
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalSources: ChatSource[] = [];
      let finalFollowUps: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let event: any;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }

          if (event.type === 'status') {
            setLoadingStatus(event.content);
          } else if (event.type === 'token') {
            if (!streamStarted) {
              // First token — add placeholder message and hide spinner
              streamStarted = true;
              setIsLoading(false);
              setSessions(prev => prev.map(s => s.id === currentSessionId
                ? { ...s, messages: [...s.messages, { id: assistantMsgId, role: 'assistant' as const, content: event.content, timestamp: new Date().toISOString() }] }
                : s
              ));
            } else {
              setSessions(prev => prev.map(s => s.id === currentSessionId
                ? { ...s, messages: s.messages.map(m => m.id === assistantMsgId ? { ...m, content: m.content + event.content } : m) }
                : s
              ));
            }
          } else if (event.type === 'done') {
            finalSources = event.sources ?? [];
            finalFollowUps = event.follow_ups ?? [];
          } else if (event.type === 'error') {
            throw new Error(event.detail);
          }
        }
      }

      // Attach sources + follow_ups, then persist
      setSessions(prev => {
        const updated = prev.map(s => {
          if (s.id !== currentSessionId) return s;
          const finalMessages = s.messages.map(m => m.id === assistantMsgId
            ? { ...m, sources: finalSources, follow_ups: finalFollowUps }
            : m
          );
          updateChatSession(currentSessionId, { messages: finalMessages as object[], name: newName }).catch(() => {});
          return { ...s, messages: finalMessages };
        });
        return updated;
      });

    } catch (error: any) {
      const status = error?.status;
      const errText = !status
        ? "Couldn't reach the server. Check your connection and try again."
        : status === 401 ? "Your session has expired. Please refresh the page."
        : status === 404 ? "This project could not be found."
        : "Something went wrong on our end. Try again in a moment.";
      const errMsg: ChatMessage = { id: Date.now().toString(), role: 'assistant', content: errText, timestamp: new Date().toISOString() };
      setSessions(prev => {
        const updated = prev.map(s => {
          if (s.id !== currentSessionId) return s;
          const finalMessages = [...s.messages.filter(m => m.id !== assistantMsgId), errMsg];
          updateChatSession(currentSessionId, { messages: finalMessages as object[] }).catch(() => {});
          return { ...s, messages: finalMessages };
        });
        return updated;
      });
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
          {sessionsLoading ? (
            <div className="flex justify-center pt-6">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.map(session => (
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
                {relativeTime(session.created_at)}
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
              onClick={() => {
              if (!activeSession) return;
              setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, messages: [] } : s));
              updateChatSession(activeSession.id, { messages: [] }).catch(() => {});
            }}
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
                  className={`flex animate-fade-in ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {message.role === 'user' ? (
                    <p className="max-w-[72%] text-sm text-foreground/80">{message.content}</p>
                  ) : (
                    <div className="max-w-[85%] border-l-2 border-primary pl-4 py-1">
                      <div className="prose prose-sm prose-invert max-w-none text-foreground [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_strong]:text-foreground [&_p]:mb-2 last:[&_p]:mb-0">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                      {message.sources && message.sources.length > 0 && (
                        <SourceList sources={message.sources} projectId={projectId} />
                      )}
                    </div>
                  )}
                </div>

                {message.role === 'assistant' && message.id !== '1' && (
                  <div className="ml-6 mt-2 flex flex-col gap-2">
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
              <div className="flex animate-fade-in">
                <div className="border-l-2 border-primary pl-4 py-1 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {loadingStatus === 'searching' ? 'Searching your papers...' : 'Generating answer...'}
                  </span>
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
