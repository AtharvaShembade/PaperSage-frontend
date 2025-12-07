import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground)) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">AI-Powered Research Platform</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-slide-up">
          <span className="text-gradient">Research Nexus</span>
          <br />
          <span className="text-foreground">Your AI Research</span>
          <br />
          <span className="text-foreground">Workbench</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Discover, analyze, and synthesize academic papers with the power of AI. 
          Transform how you conduct research.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Button 
            variant="hero" 
            size="xl" 
            onClick={() => navigate('/login')}
            className="group"
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            variant="glass" 
            size="xl"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Learn More
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient">50K+</div>
            <div className="text-sm text-muted-foreground">Papers Indexed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient">10K+</div>
            <div className="text-sm text-muted-foreground">Researchers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient">99%</div>
            <div className="text-sm text-muted-foreground">Accuracy</div>
          </div>
        </div>
      </div>
    </section>
  );
}
