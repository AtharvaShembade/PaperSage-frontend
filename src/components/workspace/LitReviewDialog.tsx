import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { litReviewSearch, litReviewGenerate, fetchProjectPapers, pinAnnotation } from '@/services/api';
import { Loader2, BookOpen, Search, FileText, Bookmark, BookmarkCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Phase = 'input' | 'searching' | 'ingesting' | 'generating' | 'done' | 'error';

interface LitReviewDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DonePhase({ review, projectId, question, onNewReview, onClose }: {
  review: string;
  projectId: string;
  question: string;
  onNewReview: () => void;
  onClose: () => void;
}) {
  const [pinned, setPinned] = useState(false);
  const [pinning, setPinning] = useState(false);

  const handlePin = async () => {
    if (pinned || pinning) return;
    setPinning(true);
    try {
      await pinAnnotation(projectId, `Literature Review: ${question}`, review);
      setPinned(true);
    } catch {
      // silent fail
    } finally {
      setPinning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="prose prose-sm prose-invert max-w-none text-foreground [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_strong]:text-foreground [&_p]:mb-2 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm">
        <ReactMarkdown>{review}</ReactMarkdown>
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-border/40">
        <Button
          variant={pinned ? "default" : "outline"}
          size="sm"
          onClick={handlePin}
          disabled={pinned || pinning}
          className={pinned ? "bg-primary/20 text-primary hover:bg-primary/20 border border-primary/30" : "border-primary/30 text-primary hover:bg-primary/10"}
        >
          {pinning ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : pinned ? <BookmarkCheck className="w-4 h-4 mr-1.5" /> : <Bookmark className="w-4 h-4 mr-1.5" />}
          {pinned ? 'Pinned' : 'Pin to notes'}
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={onNewReview}>New review</Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

export function LitReviewDialog({ projectId, open, onOpenChange }: LitReviewDialogProps) {
  const [question, setQuestion] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [paperIds, setPaperIds] = useState<number[]>([]);
  const [readyCount, setReadyCount] = useState(0);
  const [review, setReview] = useState('');
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling on unmount or close
  useEffect(() => {
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current);
      // Reset state when closing after completion
      if (phase === 'done' || phase === 'error') {
        setPhase('input');
        setQuestion('');
        setReview('');
        setError('');
        setPaperIds([]);
        setReadyCount(0);
      }
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [open, phase]);

  const handleStart = async () => {
    if (!question.trim()) return;
    setPhase('searching');
    setError('');

    try {
      const result = await litReviewSearch(projectId, question);
      setPaperIds(result.paper_ids);

      if (result.paper_ids.length === 0) {
        setError('No papers found for this question. Try rephrasing.');
        setPhase('error');
        return;
      }

      setPhase('ingesting');
      startPolling(result.paper_ids);
    } catch {
      setError('Failed to search for papers.');
      setPhase('error');
    }
  };

  const handleGenerateOnly = async () => {
    setPhase('generating');
    setError('');
    try {
      const result = await litReviewGenerate(projectId, question);
      setReview(result.review);
      setPhase('done');
    } catch {
      setError('Failed to generate review. Make sure you have ready papers.');
      setPhase('error');
    }
  };

  const startPolling = (ids: number[]) => {
    pollRef.current = setInterval(async () => {
      try {
        const papers = await fetchProjectPapers(projectId);
        const tracked = papers.filter(p => ids.includes(Number(p.id)));
        const ready = tracked.filter(p => p.status === 'ready').length;
        const failed = tracked.filter(p => p.status === 'error' || p.status === 'no_pdf').length;
        setReadyCount(ready);

        if (ready + failed >= ids.length) {
          if (pollRef.current) clearInterval(pollRef.current);
          if (ready === 0) {
            setError('All papers failed to process.');
            setPhase('error');
            return;
          }
          // Auto-generate review
          setPhase('generating');
          try {
            const result = await litReviewGenerate(projectId, question);
            setReview(result.review);
            setPhase('done');
          } catch {
            setError('Failed to generate the review.');
            setPhase('error');
          }
        }
      } catch {
        // Polling error — keep trying
      }
    }, 5000);
  };

  const phaseIndicator = () => {
    switch (phase) {
      case 'searching':
        return (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Search className="w-4 h-4 animate-pulse text-primary" />
            Searching arXiv and selecting papers...
          </div>
        );
      case 'ingesting': {
        const progress = paperIds.length > 0 ? (readyCount / paperIds.length) * 100 : 0;
        return (
          <div className="w-full max-w-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Processing papers</span>
              <span>{readyCount}/{paperIds.length} ready</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      }
      case 'generating':
        return (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            Writing literature review...
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Literature Review
          </DialogTitle>
        </DialogHeader>

        {phase === 'input' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter a research question. The agent will search arXiv, add relevant papers, and generate a structured review.
            </p>
            <Input
              placeholder="e.g. How are transformers used in drug discovery?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleStart(); }}
              className="bg-muted border-border"
            />
            <div className="flex gap-2">
              <Button onClick={handleStart} disabled={!question.trim()} className="flex-1">
                <Search className="w-4 h-4 mr-2" />
                Search & Review
              </Button>
              <Button onClick={handleGenerateOnly} variant="outline" disabled={!question.trim()} className="flex-1">
                <FileText className="w-4 h-4 mr-2" />
                Review existing papers
              </Button>
            </div>
          </div>
        )}

        {(phase === 'searching' || phase === 'ingesting' || phase === 'generating') && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            {phaseIndicator()}
          </div>
        )}

        {phase === 'error' && (
          <div className="space-y-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => setPhase('input')}>Try again</Button>
          </div>
        )}

        {phase === 'done' && (
          <DonePhase
            review={review}
            projectId={projectId}
            question={question}
            onNewReview={() => setPhase('input')}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
