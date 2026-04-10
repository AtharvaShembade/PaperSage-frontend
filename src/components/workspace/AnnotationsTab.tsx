import { useState, useEffect, useRef, useCallback, forwardRef } from 'react';
import { Annotation } from '@/types';
import { fetchAnnotations, updateAnnotation, deleteAnnotation } from '@/services/api';
import { Bookmark, Trash2, Loader2, StickyNote, NotebookPen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const PROJECT_NOTES_KEY = (projectId: string) => `project_notes_${projectId}`;

const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, {
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
}>(({ value, onChange, onBlur, placeholder, className }, forwardedRef) => {
  const innerRef = useRef<HTMLTextAreaElement>(null);
  const ref = (forwardedRef as React.RefObject<HTMLTextAreaElement>) ?? innerRef;

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [ref]);

  useEffect(() => { resize(); }, [value, resize]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => { onChange(e.target.value); resize(); }}
      onBlur={onBlur}
      placeholder={placeholder}
      rows={1}
      className={className}
      style={{ overflow: 'hidden' }}
    />
  );
});

function ProjectNotes({ projectId }: { projectId: string }) {
  const [note, setNote] = useState(() => localStorage.getItem(PROJECT_NOTES_KEY(projectId)) ?? '');
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (val: string) => {
    setNote(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      localStorage.setItem(PROJECT_NOTES_KEY(projectId), val);
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    }, 600);
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <div className="glass rounded-xl p-4 cursor-text" onClick={() => textareaRef.current?.focus()}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <NotebookPen className="w-3.5 h-3.5" />
          <span className="font-medium">Project notes</span>
        </div>
        {saved && <span className="text-xs text-primary">Saved</span>}
      </div>
      <textarea
        ref={textareaRef}
        value={note}
        onChange={e => { handleChange(e.target.value); autoResize(); }}
        placeholder="Hypotheses, open questions, things to follow up on..."
        rows={1}
        className="w-full resize-none bg-transparent border-b border-border/40 focus:border-primary/50 focus:outline-none text-sm text-foreground placeholder:text-muted-foreground/40 leading-relaxed transition-colors"
        style={{ overflow: 'hidden' }}
      />
    </div>
  );
}

interface AnnotationsTabProps {
  projectId: string;
  isActive?: boolean;
}

function AnnotationCard({
  annotation,
  onDelete,
  onUpdate,
}: {
  annotation: Annotation;
  onDelete: (id: number) => void;
  onUpdate: (id: number, note: string) => void;
}) {
  const [note, setNote] = useState(annotation.user_note ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleBlur = async () => {
    if (note === (annotation.user_note ?? '')) return;
    setSaving(true);
    try {
      await updateAnnotation(annotation.id, note);
      onUpdate(annotation.id, note);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setNote(annotation.user_note ?? '');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAnnotation(annotation.id);
      onDelete(annotation.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="glass rounded-xl p-4 space-y-3 group">
      {/* Paper title */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Bookmark className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <span className="text-xs font-medium text-primary line-clamp-1">{annotation.paper_title}</span>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
        >
          {deleting
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Trash2 className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      {/* Chunk */}
      <blockquote className="border-l-2 border-primary/30 pl-3 text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-muted-foreground [&_p]:mb-1 last:[&_p]:mb-0">
        <ReactMarkdown>{annotation.chunk_text}</ReactMarkdown>
      </blockquote>

      {/* User note */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <StickyNote className="w-3 h-3" />
            <span>Note</span>
          </div>
          {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
          {saved && <span className="text-xs text-primary">Saved</span>}
        </div>
        <AutoResizeTextarea
          value={note}
          onChange={setNote}
          onBlur={handleBlur}
          placeholder="Add a note..."
          className="w-full resize-none bg-transparent border-b border-border/40 focus:border-primary/50 focus:outline-none pb-1 text-sm text-foreground placeholder:text-muted-foreground/40 leading-relaxed transition-colors"
        />
      </div>
    </div>
  );
}

export function AnnotationsTab({ projectId, isActive }: AnnotationsTabProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    setIsLoading(true);
    setError(false);
    fetchAnnotations(projectId)
      .then(setAnnotations)
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [projectId, isActive]);

  const handleDelete = (id: number) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  const handleUpdate = (id: number, note: string) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, user_note: note } : a));
  };

  // Group by paper title
  const grouped = annotations.reduce<Record<string, Annotation[]>>((acc, a) => {
    (acc[a.paper_title] ??= []).push(a);
    return acc;
  }, {});

  const pinnedSection = () => {
    if (isLoading) return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
    if (error) return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Failed to load pinned notes.
      </div>
    );
    if (annotations.length === 0) return (
      <div className="glass rounded-xl flex flex-col items-center justify-center h-32 gap-2 text-center px-6">
        <Bookmark className="w-6 h-6 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground/60">
          Expand a source in chat and click "Pin to notes" to save passages here.
        </p>
      </div>
    );
    return (
      <div className="space-y-6">
        {Object.entries(grouped).map(([paper, items]) => (
          <div key={paper} className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {paper}
            </h3>
            {items.map(a => (
              <AnnotationCard
                key={a.id}
                annotation={a}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <ProjectNotes projectId={projectId} />
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Pinned from chat
        </h3>
        {pinnedSection()}
      </div>
    </div>
  );
}
