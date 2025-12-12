import { Twitter, Github, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-8 sm:py-10 md:py-12 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:gap-8 md:flex-row md:justify-between">
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center md:items-start gap-2 order-3 md:order-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Multiblock</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center md:text-left">
              © 2024 Multiblock. All rights reserved.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 order-1 md:order-2">
            <Link 
              to="/privacy" 
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-foreground py-2 min-h-[44px] flex items-center"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/terms" 
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-foreground py-2 min-h-[44px] flex items-center"
            >
              Terms of Service
            </Link>
            <Link 
              to="/refund" 
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-foreground py-2 min-h-[44px] flex items-center"
            >
              Refund Policy
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3 sm:gap-4 order-2 md:order-3">
            <a 
              href="#" 
              className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Twitter"
            >
              <Twitter size={18} />
            </a>
            <a 
              href="#" 
              className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Github"
            >
              <Github size={18} />
            </a>
            <a 
              href="#" 
              className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Linkedin"
            >
              <Linkedin size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
