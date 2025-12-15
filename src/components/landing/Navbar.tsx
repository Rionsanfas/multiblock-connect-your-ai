import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const { isAuthenticated } = useAppStore();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsAtTop(scrollY < 50);
    };

    // Check initial position
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "/pricing", isRoute: true },
    { label: "FAQ", href: "#faq" },
  ];

  // Text color: consistent since background is always semi-transparent
  const textColor = "text-muted-foreground";
  const textHoverColor = "hover:text-foreground";
  const logoColor = "text-foreground";
  const menuIconColor = "text-foreground";

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "transition-all duration-300 ease-[cubic-bezier(0.2,0.9,0.2,1)]",
        "motion-reduce:transition-none",
        isAtTop
          ? "bg-background/50 backdrop-blur-md border-b border-border/50"
          : "bg-background/50 backdrop-blur-md border-b border-border/30"
      )}
    >
      {/* 
        Flush edge-to-edge navbar with fluid padding.
        Uses clamp() for responsive horizontal padding.
      */}
      <div 
        className="w-full flex items-center justify-between"
        style={{ 
          paddingLeft: "clamp(16px, 4vw, 32px)",
          paddingRight: "clamp(16px, 4vw, 32px)",
          paddingTop: "clamp(12px, 2vw, 16px)",
          paddingBottom: "clamp(12px, 2vw, 16px)",
        }}
      >
        {/* Site Name Only */}
        <Link to="/" className="flex items-center">
          <span 
            className={cn(
              "font-semibold transition-colors duration-300", 
              logoColor
            )}
            style={{ fontSize: "clamp(1rem, 0.9rem + 0.5vw, 1.25rem)" }}
          >
            MultiBlock
          </span>
        </Link>

        {/* Desktop Nav - hidden on mobile/tablet, visible on laptop+ */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navLinks.map((link) =>
            link.isRoute ? (
              <Link
                key={link.label}
                to={link.href}
                className={cn(
                  "transition-colors duration-300 text-fluid-sm",
                  textColor, 
                  textHoverColor
                )}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className={cn(
                  "transition-colors duration-300 text-fluid-sm",
                  textColor, 
                  textHoverColor
                )}
              >
                {link.label}
              </a>
            )
          )}
        </div>

        {/* CTA Buttons - hidden on mobile/tablet */}
        <div className="hidden lg:flex items-center gap-3 xl:gap-4">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary">
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                className={cn("transition-colors text-fluid-sm", textColor, textHoverColor)}
              >
                Login
              </Link>
              <Link to="/pricing" className="btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle - larger touch target (min 44px) */}
        <button
          className={cn(
            "lg:hidden p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors duration-300",
            menuIconColor
          )}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 
        Mobile Menu - full width with responsive padding.
        Uses scrollable-modal class for overflow handling.
      */}
      {isOpen && (
        <div 
          className="lg:hidden bg-card/95 backdrop-blur-xl border-t border-border/50 animate-fade-in scrollable-modal"
          style={{ 
            marginLeft: "clamp(12px, 3vw, 24px)",
            marginRight: "clamp(12px, 3vw, 24px)",
            marginBottom: "clamp(12px, 3vw, 24px)",
            borderRadius: "var(--radius)",
          }}
        >
          <div className="flex flex-col gap-1 p-4">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-foreground hover:bg-secondary/50 transition-colors duration-300 py-3 px-4 rounded-lg text-fluid-base min-h-[48px] flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-foreground hover:bg-secondary/50 transition-colors duration-300 py-3 px-4 rounded-lg text-fluid-base min-h-[48px] flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              )
            )}
            <div className="border-t border-border/30 my-3" />
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="btn-primary text-center w-full"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="text-foreground hover:bg-secondary/50 transition-colors py-3 px-4 rounded-lg text-fluid-base min-h-[48px] flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/pricing"
                  className="btn-primary text-center w-full mt-2"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;