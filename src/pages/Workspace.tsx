import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProject } from '@/services/api';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PapersTab } from '@/components/workspace/PapersTab';
import { ChatTab } from '@/components/workspace/ChatTab';
import { GraphTab } from '@/components/workspace/GraphTab';
import { Zap, ArrowLeft, Search, MessageSquare, GitBranch, Loader2 } from 'lucide-react';

export default function Workspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('papers');
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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-cyan flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{project.name}</h1>
              <p className="text-sm text-muted-foreground">{project.papersCount} papers</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="glass mb-6 p-1">
            <TabsTrigger 
              value="papers" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
            >
              <Search className="w-4 h-4" />
              Papers & Search
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              RAG Chat
            </TabsTrigger>
            <TabsTrigger 
              value="graph" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
            >
              <GitBranch className="w-4 h-4" />
              Citation Graph
            </TabsTrigger>
          </TabsList>

          <TabsContent value="papers" className="mt-0">
            <PapersTab projectId={projectId!} />
          </TabsContent>
          
          <TabsContent value="chat" className="mt-0">
            <ChatTab projectId={projectId!} />
          </TabsContent>
          
          <TabsContent value="graph" className="mt-0">
            <GraphTab projectId={projectId!} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
