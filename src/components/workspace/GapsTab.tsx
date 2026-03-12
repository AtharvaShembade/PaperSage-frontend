import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GapAnalysis, GapEntry, GapSection } from '@/types';
import { runGapAnalysis } from '@/services/api';
import { Loader2, ChevronDown, ChevronUp, ArrowRight, BookmarkCheck, Bookmark } from 'lucide-react';
import { pinAnnotation } from '@/services/api';

interface GapsTabProps {
  projectId: string;
  isActive?: boolean;
  onExploreInChat: (claim: string) => void;
}

function GapEntryRow({
  entry,
  onExplore,
}: {
  entry: GapEntry;
  onExplore: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-border/30 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 py-2.5 text-left hover:bg-muted/20 transition-colors px-2 rounded"
      >
        <span className="text-primary mt-0.5 shrink-0">•</span>
        <span className="flex-1 text-sm text-foreground leading-snug">{entry.claim}</span>
        <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
          {entry.paper_title.length > 28 ? entry.paper_title.slice(0, 28) + '…' : entry.paper_title}
          {entry.paper_year ? ` ${entry.paper_year}` : ''}
        </span>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />}
      </button>

      {expanded && (
        <div className="ml-5 mr-2 mb-3 pl-3 border-l-2 border-primary/30">
          <p className="text-xs text-muted-foreground italic leading-relaxed mb-2">
            "{entry.evidence}"
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); onExplore(); }}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            Explore in Chat <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

function SectionBlock({
  section,
  onExplore,
}: {
  section: GapSection;
  onExplore: (claim: string) => void;
}) {
  if (section.entries.length === 0) {
    return (
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-0.5 h-5 bg-primary/60 rounded-full" />
          <h3 className="font-semibold text-foreground">{section.title}</h3>
          <span className="text-xs text-muted-foreground ml-auto">None found</span>
        </div>
        <p className="text-xs text-muted-foreground ml-3 mt-2">
          No clear {section.title.toLowerCase()} detected in these papers.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-0.5 h-5 bg-primary rounded-full" />
        <h3 className="font-semibold text-foreground">{section.title}</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {section.entries.length} found
        </span>
      </div>
      <div>
        {section.entries.map((entry, i) => (
          <GapEntryRow
            key={i}
            entry={entry}
            onExplore={() => onExplore(entry.claim)}
          />
        ))}
      </div>
    </div>
  );
}

const LOADING_LABELS = [
  'Scanning for open problems…',
  'Looking for contradictions…',
  'Checking methodological gaps…',
  'Finding future directions…',
];

export function GapsTab({ projectId, isActive, onExploreInChat }: GapsTabProps) {
  const [focus, setFocus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState(LOADING_LABELS[0]);
  const [analysis, setAnalysis] = useState<GapAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPinning, setIsPinning] = useState(false);
  const [pinned, setPinned] = useState(false);

  const cacheKey = `gaps_${projectId}`;

  useEffect(() => {
    if (isActive) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try { setAnalysis(JSON.parse(cached)); } catch {}
      }
    }
  }, [isActive]);

  useEffect(() => {
    if (!isLoading) return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_LABELS.length;
      setLoadingLabel(LOADING_LABELS[i]);
    }, 4000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setPinned(false);
    setLoadingLabel(LOADING_LABELS[0]);
    try {
      const result = await runGapAnalysis(projectId, focus.trim() || undefined);
      setAnalysis(result);
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch {
      setError('Analysis failed. Make sure your papers are ready and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePin = async () => {
    if (!analysis) return;
    setIsPinning(true);
    const title = `Gap Analysis${analysis.focus ? `: ${analysis.focus}` : ''}`;
    const body = analysis.sections
      .filter(s => s.entries.length > 0)
      .map(s =>
        `**${s.title}**\n` +
        s.entries.map(e => `- ${e.claim}\n  > "${e.evidence}" — *${e.paper_title}*`).join('\n')
      )
      .join('\n\n');
    try {
      await pinAnnotation(projectId, title, body);
      setPinned(true);
    } catch {}
    setIsPinning(false);
  };

  const handleReset = () => {
    setAnalysis(null);
    setFocus('');
    setPinned(false);
    localStorage.removeItem(cacheKey);
  };

  const totalGaps = analysis?.sections.reduce((sum, s) => sum + s.entries.length, 0) ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Input area */}
      <div className="glass rounded-xl p-5">
        <div className="flex gap-3">
          <Input
            placeholder="Optional focus area, e.g. efficient transformers…"
            value={focus}
            onChange={e => setFocus(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isLoading && handleAnalyze()}
            className="bg-muted border-border"
            disabled={isLoading}
          />
          <Button onClick={handleAnalyze} disabled={isLoading} className="shrink-0">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyze Gaps'}
          </Button>
        </div>
        {isLoading && (
          <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
            {loadingLabel}
          </p>
        )}
        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      </div>

      {/* Results */}
      {analysis && !isLoading && (
        <>
          {analysis.focus && (
            <p className="text-sm text-muted-foreground px-1">
              Focus: <span className="text-foreground">"{analysis.focus}"</span>
            </p>
          )}

          <div className="space-y-3">
            {analysis.sections.map(section => (
              <SectionBlock
                key={section.type}
                section={section}
                onExplore={onExploreInChat}
              />
            ))}
          </div>

          {/* Bottom actions */}
          <div className="flex items-center justify-between pt-2 pb-4">
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">
              Re-analyze
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{totalGaps} gaps found</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePin}
                disabled={isPinning || pinned}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                {pinned
                  ? <><BookmarkCheck className="w-4 h-4 text-primary" /> Pinned</>
                  : isPinning
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Pinning…</>
                    : <><Bookmark className="w-4 h-4" /> Pin to Notes</>}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!analysis && !isLoading && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">Analyze your papers to surface research gaps.</p>
          <p className="text-xs mt-1 opacity-60">All ready papers will be scanned.</p>
        </div>
      )}
    </div>
  );
}
