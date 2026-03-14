import { useState, useEffect } from 'react';
import { fetchComparisonTable } from '@/services/api';
import { ComparisonRow, ComparisonResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, TableProperties, AlertCircle } from 'lucide-react';

interface GraphTabProps {
  projectId: string;
}

const CACHE_KEY = (id: string) => `comparison_${id}`;

interface CachedData {
  rows: ComparisonRow[];
  skipped: string[];
  generatedAt: string;
}

const COLUMNS: { key: keyof ComparisonRow; label: string }[] = [
  { key: 'title',      label: 'Paper' },
  { key: 'problem',    label: 'Problem' },
  { key: 'method',     label: 'Method' },
  { key: 'dataset',    label: 'Dataset' },
  { key: 'result',     label: 'Key Result' },
  { key: 'limitation', label: 'Limitation' },
];

function loadFromCache(projectId: string): CachedData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY(projectId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToCache(projectId: string, data: ComparisonResponse) {
  const payload: CachedData = {
    rows: data.rows,
    skipped: data.skipped,
    generatedAt: new Date().toISOString(),
  };
  localStorage.setItem(CACHE_KEY(projectId), JSON.stringify(payload));
  return payload;
}

export function GraphTab({ projectId }: GraphTabProps) {
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from cache on mount
  useEffect(() => {
    const cached = loadFromCache(projectId);
    if (cached) {
      setRows(cached.rows);
      setSkipped(cached.skipped);
      setGeneratedAt(cached.generatedAt);
      setHasLoaded(true);
    }
  }, [projectId]);

  const loadComparison = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchComparisonTable(projectId);
      const saved = saveToCache(projectId, data);
      setRows(saved.rows);
      setSkipped(saved.skipped);
      setGeneratedAt(saved.generatedAt);
      setHasLoaded(true);
    } catch {
      setError('Failed to generate comparison. Make sure at least one paper is ready.');
    } finally {
      setIsLoading(false);
    }
  };

  const formattedDate = generatedAt
    ? new Date(generatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Paper Comparison</h2>
          <p className="text-sm text-muted-foreground">
            {formattedDate ? `Last generated: ${formattedDate}` : 'Side-by-side breakdown of all ready papers'}
          </p>
        </div>
        <Button onClick={loadComparison} disabled={isLoading}>
          {isLoading
            ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</>
            : <><TableProperties className="w-4 h-4 mr-2" />{hasLoaded ? 'Regenerate' : 'Generate Table'}</>
          }
        </Button>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Initial empty state */}
        {!hasLoaded && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <TableProperties className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-1">No comparison generated yet</p>
            <p className="text-sm text-muted-foreground">Click "Generate Table" to compare all ready papers</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating table...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Skipped papers notice */}
        {hasLoaded && skipped.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-400 text-sm">
            Skipped {skipped.length} paper{skipped.length > 1 ? 's' : ''} (not yet ready): {skipped.join(', ')}
          </div>
        )}

        {/* Table */}
        {hasLoaded && rows.length > 0 && !isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      className="text-left px-3 py-2 text-muted-foreground font-medium border-b border-border whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.paper_id} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                    {COLUMNS.map(col => (
                      <td
                        key={col.key}
                        className="px-3 py-3 align-top border-b border-border/50 max-w-[220px]"
                      >
                        {col.key === 'title' ? (
                          <div>
                            <p className="font-medium text-foreground line-clamp-2">{row.title}</p>
                            {row.year && <p className="text-xs text-muted-foreground mt-0.5">{row.year}</p>}
                          </div>
                        ) : (
                          <p className="text-muted-foreground leading-relaxed">{row[col.key] as string}</p>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* No ready papers */}
        {hasLoaded && rows.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No ready papers to compare.</p>
            <p className="text-sm text-muted-foreground mt-1">Add papers and wait for them to finish processing.</p>
          </div>
        )}
      </div>
    </div>
  );
}
