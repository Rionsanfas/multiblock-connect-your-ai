import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated } = useAppStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

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
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 transition-all duration-300">
      {/* Desktop Pill Navbar */}
      <div
        className={cn(
          "hidden lg:flex items-center gap-3 rounded-full transition-all duration-500 ease-out",
          "backdrop-blur-xl",
          // Transparent at top, visible background on scroll
          isScrolled 
            ? "bg-card/80 border border-border/60 shadow-[0_4px_24px_-4px_hsl(0_0%_0%/0.4),inset_0_1px_0_0_hsl(0_0%_100%/0.06)]"
            : "bg-transparent border border-transparent shadow-none"
        )}
        style={{ padding: "8px 12px" }}
      >
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center px-3 py-2 rounded-full hover:bg-secondary/50 transition-colors"
        >
          <span className="font-semibold text-foreground text-sm">
            MultiBlock
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center">
          {navLinks.map((link) =>
            link.isRoute ? (
              <Link
                key={link.label}
                to={link.href}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/40"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/40"
              >
                {link.label}
              </a>
            )
          )}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2 pl-2">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Header */}
      <div
        className={cn(
          "lg:hidden w-full flex items-center justify-between rounded-full transition-all duration-500",
          "backdrop-blur-xl px-4 py-2",
          isScrolled 
            ? "bg-card/80 border border-border/60 shadow-[0_4px_24px_-4px_hsl(0_0%_0%/0.4),inset_0_1px_0_0_hsl(0_0%_100%/0.06)]"
            : "bg-transparent border border-transparent shadow-none"
        )}
      >
        <Link to="/" className="flex items-center">
          <span className="font-semibold text-foreground text-sm">MultiBlock</span>
        </Link>

        <button
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground touch-manipulation"
          onClick={() => setIsOpen(!isOpen)}
          onTouchEnd={(e) => {
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown - ensure touch works */}
      {isOpen && (
        <div
          className="lg:hidden absolute top-20 left-4 right-4 bg-card/95 backdrop-blur-xl border border-border/40 rounded-2xl shadow-[0_8px_32px_-8px_hsl(0_0%_0%/0.6)] animate-fade-in overflow-hidden z-50"
        >
          <div className="flex flex-col p-3">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-foreground hover:bg-secondary/50 transition-colors py-3 px-4 rounded-xl text-sm touch-manipulation"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-foreground hover:bg-secondary/50 transition-colors py-3 px-4 rounded-xl text-sm touch-manipulation"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              )
            )}
            <div className="border-t border-border/30 my-2" />
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="bg-primary text-primary-foreground text-center py-3 px-4 rounded-xl text-sm font-medium touch-manipulation block"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/auth"
                className="bg-primary text-primary-foreground text-center py-3 px-4 rounded-xl text-sm font-medium touch-manipulation block"
                onClick={() => setIsOpen(false)}
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
