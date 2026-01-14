import { Link } from "react-router-dom";
import logoImage from "@/assets/logo.png";

/* Real X (Twitter) Logo SVG */
const XLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

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
            <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src={logoImage} alt="Multiblock" className="h-6 w-6 object-contain" loading="eager" />
              <span 
                className="font-semibold text-foreground"
                style={{ fontSize: "clamp(0.875rem, 0.8rem + 0.25vw, 1rem)" }}
              >
                Multiblock
              </span>
            </Link>
            <p 
              className="text-muted-foreground text-center md:text-left"
              style={{ fontSize: "clamp(0.75rem, 0.7rem + 0.15vw, 0.875rem)" }}
            >
              © 2024 Multiblock. All rights reserved.
            </p>
          </div>

          {/* Links - centered properly */}
          <div 
            className="flex flex-wrap items-center justify-center order-1 md:order-2 flex-1 md:justify-center"
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

          {/* Social Links - Only X with 3D premium styling */}
          <div className="flex items-center order-2 md:order-3">
            <a 
              href="#" 
              className="group relative rounded-full flex items-center justify-center text-muted-foreground transition-all duration-500 ease-out focus:outline-none focus:ring-2 focus:ring-primary/50"
              style={{ width: "48px", height: "48px" }}
              aria-label="X (Twitter)"
            >
              {/* 3D layered background */}
              <div 
                className="absolute inset-0 rounded-full bg-gradient-to-b from-secondary to-background border border-border/80 group-hover:border-muted-foreground/30 transition-all duration-500 ease-out"
                style={{
                  boxShadow: `
                    0 4px 12px -2px hsl(0 0% 0% / 0.4),
                    0 2px 4px -1px hsl(0 0% 0% / 0.3),
                    inset 0 1px 0 0 hsl(0 0% 100% / 0.08),
                    inset 0 -1px 2px 0 hsl(0 0% 0% / 0.2)
                  `
                }}
              />
              {/* Icon with 3D effect */}
              <div 
                className="relative z-10 group-hover:text-foreground transition-all duration-500 ease-out group-hover:scale-105"
                style={{
                  filter: 'drop-shadow(0 1px 1px hsl(0 0% 0% / 0.3))'
                }}
              >
                <XLogo />
              </div>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;