import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProject } from '@/services/api';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PapersTab } from '@/components/workspace/PapersTab';
import { ChatTab } from '@/components/workspace/ChatTab';
import { GraphTab } from '@/components/workspace/GraphTab';
import { AnnotationsTab } from '@/components/workspace/AnnotationsTab';
import { GapsTab } from '@/components/workspace/GapsTab';
import { LitReviewDialog } from '@/components/workspace/LitReviewDialog';
import { CommandPalette, PaletteCommand } from '@/components/CommandPalette';
import { ArrowLeft, Search, MessageSquare, TableProperties, Bookmark, BookOpen, GitBranch, Loader2 } from 'lucide-react';

export default function Workspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('papers');
  const [litReviewOpen, setLitReviewOpen] = useState(false);
  const [pendingChatQuery, setPendingChatQuery] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const paletteCommands: PaletteCommand[] = [
    { id: 'tab-papers',  label: 'Go to Papers & Search',  icon: <Search className="w-4 h-4" />,          group: 'Navigate', onSelect: () => setActiveTab('papers') },
    { id: 'tab-chat',    label: 'Go to RAG Chat',          icon: <MessageSquare className="w-4 h-4" />,    group: 'Navigate', onSelect: () => setActiveTab('chat') },
    { id: 'tab-graph',   label: 'Go to Compare Papers',    icon: <TableProperties className="w-4 h-4" />,  group: 'Navigate', onSelect: () => setActiveTab('graph') },
    { id: 'tab-gaps',    label: 'Go to Research Gaps',     icon: <GitBranch className="w-4 h-4" />,        group: 'Navigate', onSelect: () => setActiveTab('gaps') },
    { id: 'tab-notes',   label: 'Go to Notes',             icon: <Bookmark className="w-4 h-4" />,         group: 'Navigate', onSelect: () => setActiveTab('notes') },
    { id: 'lit-review',  label: 'Open Literature Review',  icon: <BookOpen className="w-4 h-4" />,         group: 'Actions',  onSelect: () => setLitReviewOpen(true) },
    { id: 'dashboard',   label: 'Back to Dashboard',       icon: <ArrowLeft className="w-4 h-4" />,        group: 'Actions',  onSelect: () => navigate('/dashboard') },
  ];

  const handleExploreInChat = (claim: string) => {
    setPendingChatQuery(
      `Based on the papers in this project, explain this gap and what it would take to address it: ${claim}`
    );
    setActiveTab('chat');
  };
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  const loadProject = async (id: string) => {
    setIsLoading(true);
    const data = await fetchProject(id);
    setProject(data || null);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Project not found</h1>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-strong border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <img src="/dark-owl.png" alt="PaperSage" className="w-10 h-10 rounded-lg object-cover cursor-pointer" onClick={() => navigate('/dashboard')} />
            <div>
              <h1 className="text-lg font-semibold text-foreground">{project.name}</h1>
              <p className="text-sm text-muted-foreground">{project.papers?.length ?? 0} papers</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-sm text-muted-foreground"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search commands</span>
              <kbd className="text-[10px] border border-border rounded px-1 py-0.5 ml-1">⌘K</kbd>
            </button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-primary border-primary/30 hover:bg-primary/10"
              onClick={() => setLitReviewOpen(true)}
            >
              <BookOpen className="w-4 h-4" />
              Literature Review
            </Button>
          </div>
        </div>
      </header>

      <LitReviewDialog projectId={projectId!} open={litReviewOpen} onOpenChange={setLitReviewOpen} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} commands={paletteCommands} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="flex justify-center bg-transparent border-0 border-b border-border rounded-none mb-6 p-0 h-auto gap-0">
            <TabsTrigger
              value="papers"
              className="gap-2 px-5 py-3 rounded-none bg-transparent border-0 border-b-2 border-transparent text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground transition-colors"
            >
              <Search className="w-4 h-4" />
              Papers & Search
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="gap-2 px-5 py-3 rounded-none bg-transparent border-0 border-b-2 border-transparent text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              RAG Chat
            </TabsTrigger>
            <TabsTrigger
              value="graph"
              className="gap-2 px-5 py-3 rounded-none bg-transparent border-0 border-b-2 border-transparent text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground transition-colors"
            >
              <TableProperties className="w-4 h-4" />
              Compare Papers
            </TabsTrigger>
            <TabsTrigger
              value="gaps"
              className="gap-2 px-5 py-3 rounded-none bg-transparent border-0 border-b-2 border-transparent text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground transition-colors"
            >
              <GitBranch className="w-4 h-4" />
              Research Gaps
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="gap-2 px-5 py-3 rounded-none bg-transparent border-0 border-b-2 border-transparent text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground transition-colors"
            >
              <Bookmark className="w-4 h-4" />
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="papers" className="mt-0" forceMount hidden={activeTab !== 'papers'}>
            <PapersTab projectId={projectId!} />
          </TabsContent>

          <TabsContent value="chat" className="mt-0" forceMount hidden={activeTab !== 'chat'}>
            <ChatTab
              projectId={projectId!}
              isActive={activeTab === 'chat'}
              pendingQuery={pendingChatQuery}
              onPendingQueryConsumed={() => setPendingChatQuery(null)}
            />
          </TabsContent>

          <TabsContent value="graph" className="mt-0" forceMount hidden={activeTab !== 'graph'}>
            <GraphTab projectId={projectId!} />
          </TabsContent>

          <TabsContent value="gaps" className="mt-0" forceMount hidden={activeTab !== 'gaps'}>
            <GapsTab
              projectId={projectId!}
              isActive={activeTab === 'gaps'}
              onExploreInChat={handleExploreInChat}
            />
          </TabsContent>

          <TabsContent value="notes" className="mt-0" forceMount hidden={activeTab !== 'notes'}>
            <AnnotationsTab projectId={projectId!} isActive={activeTab === 'notes'} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
