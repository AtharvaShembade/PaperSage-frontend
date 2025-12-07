import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Paper, SearchResult } from '@/types';
import { searchPapers, fetchProjectPapers, addPaperToProject, processPaper } from '@/services/api';
import { Search, Plus, FileText, Loader2, CheckCircle, Clock, ExternalLink } from 'lucide-react';

interface PapersTabProps {
  projectId: string;
}

export function PapersTab({ projectId }: PapersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [addingPapers, setAddingPapers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPapers();
  }, [projectId]);

  const loadPapers = async () => {
    const data = await fetchProjectPapers(projectId);
    setPapers(data);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchPapers(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleAddPaper = async (result: SearchResult) => {
    setAddingPapers(prev => new Set(prev).add(result.id));
    
    // Transform SearchResult to the expected API format
    await addPaperToProject(projectId, {
      external_id: result.id,
      title: result.title,
      abstract: result.abstract,
      year: result.year,
      ...(result.openAccessPdf?.url && { pdf_url: result.openAccessPdf.url }),
    });

    await loadPapers();
    
    setSearchResults(prev => prev.filter(r => r.id !== result.id));
    setAddingPapers(prev => {
      const newSet = new Set(prev);
      newSet.delete(result.id);
      return newSet;
    });
  };

  const getStatusIcon = (status: Paper['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-emerald" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-cyan animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Search Panel */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Search Papers</h2>
        
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

        {/* Search Results */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {searchResults.length === 0 && !isSearching && (
            <p className="text-center text-muted-foreground py-8">
              Search for papers to add to your project
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
                    <span>{result.citations.toLocaleString()} citations</span>
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
          {papers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No papers added yet</p>
              <p className="text-sm text-muted-foreground">Search and add papers to get started</p>
            </div>
          ) : (
            papers.map((paper, index) => (
              <div 
                key={paper.id} 
                className="glass p-4 rounded-lg animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getStatusIcon(paper.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground line-clamp-1">{paper.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {(paper.authors || []).slice(0, 2).join(', ')} • {paper.year}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        paper.status === 'ready' 
                          ? 'bg-emerald/20 text-emerald' 
                          : paper.status === 'processing'
                            ? 'bg-cyan/20 text-cyan'
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {paper.status === 'processing' ? 'Processing...' : paper.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
