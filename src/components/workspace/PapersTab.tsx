import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Paper, SearchResult } from '@/types';
import { searchPapers, fetchProjectPapers, addPaperToProject, removePaperFromProject, fetchRelatedPapers } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, FileText, Loader2, Trash2, Quote, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PapersTabProps {
  projectId: string;
}

export function PapersTab({ projectId }: PapersTabProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [papersLoading, setPapersLoading] = useState(true);
  const [addingPapers, setAddingPapers] = useState<Set<string>>(new Set());
  const [removingPapers, setRemovingPapers] = useState<Set<string>>(new Set());
  const [paperToDelete, setPaperToDelete] = useState<Paper | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverMode, setDiscoverMode] = useState(false);
  const [openCiteId, setOpenCiteId] = useState<number | string | null>(null);
  const [citePos, setCitePos] = useState<{ top: number; left: number } | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const citeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (citeDropdownRef.current && !citeDropdownRef.current.contains(e.target as Node)) {
        setOpenCiteId(null);
      }
    };
    if (openCiteId !== null) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openCiteId]);

  const buildAPA = (paper: Paper): string => {
    const authors = paper.authors || [];
    const formatAuthor = (a: string) => {
      const parts = a.trim().split(' ');
      if (parts.length === 1) return a;
      const last = parts[parts.length - 1];
      const initials = parts.slice(0, -1).map(p => p[0] + '.').join(' ');
      return `${last}, ${initials}`;
    };
    let authorStr = '';
    if (authors.length === 0) authorStr = 'Unknown';
    else if (authors.length === 1) authorStr = formatAuthor(authors[0]);
    else authorStr = authors.slice(0, -1).map(formatAuthor).join(', ') + ', & ' + formatAuthor(authors[authors.length - 1]);
    const year = paper.year ? `(${paper.year})` : '(n.d.)';
    const id = String(paper.external_id || '');
    const url = id ? `https://arxiv.org/abs/${id}` : '';
    return `${authorStr} ${year}. ${paper.title}. arXiv.${url ? ' ' + url : ''}`;
  };

  const buildBibTeX = (paper: Paper): string => {
    const firstAuthor = (paper.authors?.[0] || 'unknown').split(' ').pop()?.toLowerCase() || 'unknown';
    const key = `${firstAuthor}${paper.year || 'nd'}`;
    const authors = (paper.authors || []).join(' and ') || 'Unknown';
    const id = String(paper.external_id || '');
    return `@misc{${key},\n  title={${paper.title}},\n  author={${authors}},\n  year={${paper.year || 'n.d.'}},\n  eprint={${id}},\n  archivePrefix={arXiv}\n}`;
  };

  const handleCopy = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  useEffect(() => {
    loadPapers();
  }, [projectId]);

  useEffect(() => {
    const hasProcessing = papers.some(p => p.status === 'processing');
    if (!hasProcessing) return;
    const interval = setInterval(async () => {
      const data = await fetchProjectPapers(projectId);
      setPapers(data);
      if (!data.some(p => p.status === 'processing')) {
        clearInterval(interval);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [papers, projectId]);

  const loadPapers = async () => {
    setPapersLoading(true);
    const data = await fetchProjectPapers(projectId);
    setPapers(data);
    setPapersLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setDiscoverMode(false);
    try {
      const results = await searchPapers(searchQuery);
      setSearchResults(results);
    } catch {
      toast({ title: 'Search failed', description: 'Could not search papers. Try again.', variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleDiscover = async () => {
    setIsDiscovering(true);
    setDiscoverMode(true);
    setSearchQuery('');
    try {
      const results = await fetchRelatedPapers(projectId);
      setSearchResults(results);
    } catch {
      toast({ title: 'Discovery failed', description: 'Could not find related papers. Try again.', variant: 'destructive' });
      setDiscoverMode(false);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleAddPaper = async (result: SearchResult) => {
    setAddingPapers(prev => new Set(prev).add(result.id));

    try {
      await addPaperToProject(projectId, {
        external_id: result.id,
        title: result.title,
        abstract: result.abstract,
        year: result.year ?? undefined,
        pdf_url: result.pdf_url,
        arxiv_id: result.arxiv_id,
      });

      await loadPapers();
      setSearchResults(prev => prev.filter(r => r.id !== result.id));
    } catch {
      toast({ title: 'Failed to add paper', description: 'Could not add the paper. Try again.', variant: 'destructive' });
    } finally {
      setAddingPapers(prev => {
        const newSet = new Set(prev);
        newSet.delete(result.id);
        return newSet;
      });
    }
  };

  const handleRemovePaper = async (paperId: string) => {
    setRemovingPapers(prev => new Set(prev).add(paperId));
    try {
      await removePaperFromProject(projectId, paperId);
      setPapers(prev => prev.filter(p => String(p.id) !== paperId));
    } catch {
      toast({ title: 'Failed to remove paper', description: 'Could not remove the paper. Try again.', variant: 'destructive' });
    } finally {
      setRemovingPapers(prev => { const s = new Set(prev); s.delete(paperId); return s; });
    }
  };

  const statusDot = (status: Paper['status']) => {
    const base = 'w-2 h-2 rounded-full shrink-0 mt-1.5';
    switch (status) {
      case 'ready':       return <span className={`${base} bg-indigo-700`} />;
      case 'processing':  return <span className={`${base} bg-primary/60 animate-pulse`} />;
      case 'no_pdf':      return <span className={`${base} bg-slate-700`} />;
      default:            return <span className={`${base} bg-rose-700`} />;
    }
  };

  const statusBorderClass = (status: Paper['status']) => {
    switch (status) {
      case 'ready':      return 'border-l-2 border-indigo-700/60';
      case 'processing': return 'border-l-2 border-primary/60';
      case 'no_pdf':     return 'border-l-2 border-slate-700/60';
      default:           return 'border-l-2 border-rose-700/60';
    }
  };

  const statusLabel = (status: Paper['status']) => {
    switch (status) {
      case 'ready':      return 'ready';
      case 'processing': return 'processing…';
      case 'no_pdf':     return 'no pdf';
      default:           return 'error';
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Search Panel */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-semibold text-foreground">
            {discoverMode ? 'Related Papers' : 'Search Papers'}
          </h2>
          <div className="flex items-center gap-2">
            {papers.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscover}
                disabled={isDiscovering}
                className="text-primary hover:text-primary/80 gap-1.5"
              >
                {isDiscovering && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isDiscovering ? 'Finding...' : 'Find Related'}
              </Button>
            )}
            {searchResults.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { setSearchResults([]); setSearchQuery(''); setDiscoverMode(false); }} className="text-muted-foreground hover:text-foreground">
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for papers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 bg-muted border-border"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </Button>
        </div>

        {/* Search / Discovery Results */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {searchResults.length === 0 && !isSearching && !isDiscovering && (
            <p className="text-center text-muted-foreground py-8">
              {papers.length > 0
                ? 'Search for papers or click Find Related'
                : 'Search for papers to add to your project'}
            </p>
          )}
          
          {searchResults.map((result, index) => (
            <div 
              key={result.id} 
              className="glass p-4 rounded-lg hover:border-primary/30 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground line-clamp-2 mb-1">{result.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {result.authors.slice(0, 3).join(', ')} • {result.year}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{result.abstract}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    {result.citations != null && <span>{result.citations.toLocaleString()} citations</span>}
                    <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded-full">PDF Available</span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleAddPaper(result)}
                  disabled={addingPapers.has(result.id)}
                  className="shrink-0"
                >
                  {addingPapers.has(result.id) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Papers Panel */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Project Papers ({papers.length})
        </h2>
        
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {papersLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass pl-3 pr-4 py-3 rounded-lg border-l-2 border-border animate-pulse">
                  <div className="h-3.5 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : papers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No papers added yet</p>
              <p className="text-sm text-muted-foreground">Search and add papers to get started</p>
            </div>
          ) : (
            papers.map((paper, index) => (
              <div
                key={paper.id}
                className={`glass pl-3 pr-4 py-3 rounded-lg animate-fade-in ${statusBorderClass(paper.status)}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      {statusDot(paper.status)}
                      <h3 className="font-medium text-foreground line-clamp-2 leading-snug">{paper.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-4">
                      {(paper.authors || []).slice(0, 2).join(', ')}{paper.year ? ` · ${paper.year}` : ''} · {statusLabel(paper.status)}
                    </p>
                    {paper.tldr && (
                      <p className="mt-1.5 ml-4 text-xs text-muted-foreground leading-relaxed">
                        {paper.tldr}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        if (openCiteId === paper.id) { setOpenCiteId(null); return; }
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setCitePos({ top: rect.bottom + 4, left: rect.right - 224 });
                        setOpenCiteId(paper.id);
                      }}
                      className="text-muted-foreground hover:text-primary"
                      title="Cite"
                    >
                      <Quote className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPaperToDelete(paper)}
                      disabled={removingPapers.has(String(paper.id))}
                      className="text-muted-foreground hover:text-red-400"
                    >
                      {removingPapers.has(String(paper.id))
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                      }
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!paperToDelete} onOpenChange={() => setPaperToDelete(null)}>
        <DialogContent className="glass-strong border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Remove paper?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground line-clamp-2">
            "{paperToDelete?.title}" will be removed from this project.
          </p>
          <div className="flex gap-3 mt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setPaperToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              autoFocus
              onClick={async () => {
                if (!paperToDelete) return;
                setPaperToDelete(null);
                await handleRemovePaper(String(paperToDelete.id));
              }}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Citation dropdown portal */}
      {openCiteId !== null && citePos && (() => {
        const paper = papers.find(p => p.id === openCiteId);
        if (!paper) return null;
        return createPortal(
          <div
            ref={citeDropdownRef}
            className="fixed z-[9999] glass border border-border rounded-lg p-3 w-56 shadow-lg"
            style={{ top: citePos.top, left: Math.max(8, citePos.left) }}
          >
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Copy Citation</p>
            <div className="space-y-1">
              <button
                onClick={() => handleCopy(buildAPA(paper), `apa-${paper.id}`)}
                className="w-full flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-muted/50 transition-colors text-foreground"
              >
                <span>APA</span>
                {copiedFormat === `apa-${paper.id}` ? <Check className="w-3.5 h-3.5 text-sky-400" /> : <span className="text-xs text-muted-foreground">Copy</span>}
              </button>
              <button
                onClick={() => handleCopy(buildBibTeX(paper), `bib-${paper.id}`)}
                className="w-full flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-muted/50 transition-colors text-foreground"
              >
                <span>BibTeX</span>
                {copiedFormat === `bib-${paper.id}` ? <Check className="w-3.5 h-3.5 text-sky-400" /> : <span className="text-xs text-muted-foreground">Copy</span>}
              </button>
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
}
