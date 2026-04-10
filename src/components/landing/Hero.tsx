import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4">

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-serif font-semibold mb-6 leading-tight animate-slide-up text-foreground">
          PaperSage
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Add papers, ask questions, get answers grounded in the source.
          No more skimming 40-page PDFs.
        </p>
        
        <div className="flex items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
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
            variant="outline"
            size="xl"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Learn More
          </Button>
        </div>

      </div>
    </section>
  );
}
