import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/owl.png" alt="PaperSage" className="w-10 h-10 rounded-lg object-cover" />
          <span className="text-xl font-serif font-semibold text-foreground">PaperSage</span>
        </div>


        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </div>
    </nav>
  );
}
