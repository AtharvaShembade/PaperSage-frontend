import { Search, GitBranch, MessageSquare, Zap, Shield, Globe } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Smart Search',
    description: 'Find relevant papers instantly with AI-powered semantic search across millions of academic publications.',
    gradient: 'from-primary to-primary/50'
  },
  {
    icon: GitBranch,
    title: 'Citation Analysis',
    description: 'Visualize citation networks and discover influential papers with interactive knowledge graphs.',
    gradient: 'from-cyan to-cyan/50'
  },
  {
    icon: MessageSquare,
    title: 'RAG Chat',
    description: 'Ask questions about your research papers and get accurate, cited answers from your document collection.',
    gradient: 'from-emerald to-emerald/50'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Process and analyze papers in seconds with our optimized AI pipeline and vector search.',
    gradient: 'from-primary to-cyan'
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your research data is encrypted and never shared. Full control over your intellectual property.',
    gradient: 'from-cyan to-emerald'
  },
  {
    icon: Globe,
    title: 'Multi-Language',
    description: 'Support for papers in 40+ languages with automatic translation and cross-lingual search.',
    gradient: 'from-emerald to-primary'
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Powerful Features</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to accelerate your research workflow
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="glass rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:scale-105 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-primary-foreground" />
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
