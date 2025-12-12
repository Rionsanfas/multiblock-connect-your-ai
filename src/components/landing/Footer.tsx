import { Twitter, Github, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Multiblock</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Multiblock. All rights reserved.
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8">
            <Link 
              to="/privacy" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/terms" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-foreground"
            >
              Terms of Service
            </Link>
            <Link 
              to="/refund" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-foreground"
            >
              Refund Policy
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a 
              href="#" 
              className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <Twitter size={18} />
            </a>
            <a 
              href="#" 
              className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <Github size={18} />
            </a>
            <a 
              href="#" 
              className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
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
