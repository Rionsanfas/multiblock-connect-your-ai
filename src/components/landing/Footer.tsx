import { Twitter, Github, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer 
      className="border-t border-border"
      style={{ paddingTop: "clamp(32px, 4vw, 48px)", paddingBottom: "clamp(32px, 4vw, 48px)" }}
    >
      {/* Container with responsive padding */}
      <div 
        className="w-full max-w-[1200px] mx-auto"
        style={{ paddingLeft: "clamp(16px, 4vw, 32px)", paddingRight: "clamp(16px, 4vw, 32px)" }}
      >
        {/* 
          Flexbox layout that stacks on mobile, row on tablet+.
          Uses flex-wrap for graceful wrapping.
        */}
        <div 
          className="flex flex-col items-center md:flex-row md:justify-between"
          style={{ gap: "clamp(24px, 4vw, 32px)" }}
        >
          {/* Logo & Copyright - order changes on mobile */}
          <div className="flex flex-col items-center md:items-start gap-2 order-3 md:order-1">
            <div className="flex items-center gap-2">
              <span 
                className="font-semibold text-foreground"
                style={{ fontSize: "clamp(0.875rem, 0.8rem + 0.25vw, 1rem)" }}
              >
                Multiblock
              </span>
            </div>
            <p 
              className="text-muted-foreground text-center md:text-left"
              style={{ fontSize: "clamp(0.75rem, 0.7rem + 0.15vw, 0.875rem)" }}
            >
              © 2024 Multiblock. All rights reserved.
            </p>
          </div>

          {/* Links - flex-wrap for graceful wrapping */}
          <div 
            className="flex flex-wrap items-center justify-center order-1 md:order-2"
            style={{ gap: "clamp(16px, 3vw, 32px)" }}
          >
            <Link 
              to="/privacy" 
              className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-foreground py-2 min-h-[44px] flex items-center"
              style={{ fontSize: "clamp(0.75rem, 0.7rem + 0.15vw, 0.875rem)" }}
            >
              Privacy Policy
            </Link>
            <Link 
              to="/terms" 
              className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-foreground py-2 min-h-[44px] flex items-center"
              style={{ fontSize: "clamp(0.75rem, 0.7rem + 0.15vw, 0.875rem)" }}
            >
              Terms of Service
            </Link>
            <Link 
              to="/refund" 
              className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-foreground py-2 min-h-[44px] flex items-center"
              style={{ fontSize: "clamp(0.75rem, 0.7rem + 0.15vw, 0.875rem)" }}
            >
              Refund Policy
            </Link>
          </div>

          {/* Social Links - min touch targets 44px */}
          <div className="flex items-center gap-3 order-2 md:order-3">
            <a 
              href="#" 
              className="rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
              style={{ width: "44px", height: "44px" }}
              aria-label="Twitter"
            >
              <Twitter style={{ width: "18px", height: "18px" }} />
            </a>
            <a 
              href="#" 
              className="rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
              style={{ width: "44px", height: "44px" }}
              aria-label="Github"
            >
              <Github style={{ width: "18px", height: "18px" }} />
            </a>
            <a 
              href="#" 
              className="rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
              style={{ width: "44px", height: "44px" }}
              aria-label="Linkedin"
            >
              <Linkedin style={{ width: "18px", height: "18px" }} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;