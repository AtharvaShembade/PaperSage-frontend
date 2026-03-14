import { MessageSquare, GitBranch, BookOpen, TableProperties, Search, Bookmark } from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'Agentic RAG Chat',
    description: 'Ask anything about your papers. The AI agent retrieves relevant passages on its own, answers with citations, and suggests follow-up questions.',
  },
  {
    icon: GitBranch,
    title: 'Research Gaps',
    description: 'Scan all your papers for open problems, contradictions, methodological gaps, and future directions. Grounded in verbatim evidence.',
  },
  {
    icon: BookOpen,
    title: 'Literature Review',
    description: 'Type a research question and get a structured review: background, key approaches, gaps, and future work. Generated from real papers.',
  },
  {
    icon: TableProperties,
    title: 'Paper Comparison',
    description: 'Side-by-side table of problem, method, dataset, result, and limitations across all your papers.',
  },
  {
    icon: Search,
    title: 'Related Papers',
    description: 'AI reads your existing papers and discovers related work on arXiv. No manual searching required.',
  },
  {
    icon: Bookmark,
    title: 'Notes & Annotations',
    description: 'Pin source chunks from chat directly to your notes. Add your own commentary per highlight.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Powerful Features</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything a researcher needs, without reading every page
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="glass rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:scale-105 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 transition-transform">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
