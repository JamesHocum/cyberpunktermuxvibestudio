export const StudioFooter = () => {
  return (
    <footer className="border-t border-purple-600/20 bg-transparent backdrop-blur-md py-4 px-6">
      <div className="flex flex-col items-center space-y-3">
        <nav className="flex items-center space-x-6 text-sm">
          <a 
            href="#" 
            className="text-matrix-green/70 hover:text-matrix-green transition-colors"
          >
            Documentation
          </a>
          <a 
            href="#" 
            className="text-matrix-green/70 hover:text-matrix-green transition-colors"
          >
            API Reference
          </a>
          <a 
            href="#" 
            className="text-matrix-green/70 hover:text-matrix-green transition-colors"
          >
            Community
          </a>
          <a 
            href="#" 
            className="text-matrix-green/70 hover:text-matrix-green transition-colors"
          >
            Support
          </a>
        </nav>
        
        <p className="text-xs text-matrix-green/60">
          A Spell Weaver Studios Application
        </p>
        
        <div className="flex items-center space-x-2 text-xs text-matrix-green/50">
          <span>© 2025 Harold Hocum | Architect & Systems Engineer</span>
          <span>•</span>
          <a 
            href="mailto:Harold.Hocum@Gmail.com"
            className="hover:text-matrix-green transition-colors"
          >
            Harold.Hocum@Gmail.com
          </a>
          <span>•</span>
          <a 
            href="https://harold-hocum-develop-7loc.bolt.host/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-purple hover:text-neon-purple/80 transition-colors font-semibold"
          >
            Portfolio
          </a>
        </div>
      </div>
    </footer>
  );
};
