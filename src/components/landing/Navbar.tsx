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

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 py-3 sm:py-4",
        "transition-all duration-300 ease-[cubic-bezier(0.2,0.9,0.2,1)]",
        "motion-reduce:transition-none",
        isAtTop
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4 pointer-events-none"
      )}
    >
      <div className="container mx-auto">
        <div
          className={cn(
            "px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between rounded-xl",
            "transition-all duration-300 ease-[cubic-bezier(0.2,0.9,0.2,1)]",
            "motion-reduce:transition-none",
            isAtTop
              ? "bg-background/80 backdrop-blur-md border border-border/50 shadow-sm"
              : "bg-transparent border-transparent"
          )}
        >
          {/* Site Name Only */}
          <Link to="/" className="flex items-center">
            <span className="font-semibold text-base sm:text-lg text-foreground">MultiBlock</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 text-sm"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 text-sm"
                >
                  {link.label}
                </a>
              )
            )}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary text-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  Login
                </Link>
                <Link to="/pricing" className="btn-primary text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle - larger touch target */}
          <button
            className="md:hidden text-foreground p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl p-5 animate-fade-in">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-foreground hover:bg-secondary/50 transition-colors duration-300 py-3 px-4 rounded-lg text-base min-h-[48px] flex items-center"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-foreground hover:bg-secondary/50 transition-colors duration-300 py-3 px-4 rounded-lg text-base min-h-[48px] flex items-center"
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
                  className="btn-primary text-center text-base py-3 min-h-[48px] flex items-center justify-center"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="text-foreground hover:bg-secondary/50 transition-colors py-3 px-4 rounded-lg text-base min-h-[48px] flex items-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/pricing"
                    className="btn-primary text-center text-base py-3 mt-2 min-h-[48px] flex items-center justify-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
