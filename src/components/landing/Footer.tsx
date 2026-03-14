
export function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/dark-owl.png" alt="PaperSage" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-lg font-semibold text-foreground">PaperSage</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="https://www.linkedin.com/in/atharva-shembade/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © 2025 PaperSage · Built by{' '}
            <a href="https://www.linkedin.com/in/atharva-shembade/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Atharva Shembade
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
