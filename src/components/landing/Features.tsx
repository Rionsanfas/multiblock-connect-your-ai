import { MessageSquare, GitBranch, Layout } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Multi-Model Chat Workspace",
    description: "Chat with GPT-4, Claude, Gemini, and more—all in one unified interface. Switch models instantly without juggling tabs.",
  },
  {
    icon: GitBranch,
    title: "Connect Blocks to Automate",
    description: "Link model outputs together. Let one AI's response feed into another, creating powerful automated workflows.",
  },
  {
    icon: Layout,
    title: "Visual Board with Unlimited Blocks",
    description: "Drag, drop, and arrange your AI blocks on an infinite canvas. Organize complex projects visually.",
  },
];

const Features = () => {
  return (
    <section 
      id="features" 
      className="relative"
      style={{ paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}
    >
      {/* 
        Container with responsive padding.
        Max-width prevents content from stretching too wide.
      */}
      <div 
        className="w-full max-w-[1200px] mx-auto"
        style={{ paddingLeft: "clamp(16px, 4vw, 32px)", paddingRight: "clamp(16px, 4vw, 32px)" }}
      >
        {/* Header */}
        <div 
          className="text-center"
          style={{ marginBottom: "clamp(32px, 5vw, 64px)" }}
        >
          <span className="section-badge mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Features
          </span>
          <h2 
            className="font-bold text-foreground mt-4 text-wrap-balance"
            style={{ 
              fontSize: "clamp(1.5rem, 1rem + 2.5vw, 3rem)",
              marginBottom: "clamp(12px, 2vw, 16px)",
            }}
          >
            Built for AI Power Users
          </h2>
          <p 
            className="text-muted-foreground max-w-xl mx-auto text-break"
            style={{ fontSize: "clamp(0.875rem, 0.8rem + 0.25vw, 1rem)" }}
          >
            Everything you need to orchestrate multiple AI models in a single, 
            intuitive workspace.
          </p>
        </div>

        {/* 
          Feature Cards using responsive grid.
          auto-fit with minmax ensures cards wrap gracefully.
          min() prevents cards from being too small on narrow screens.
        */}
        <div 
          className="grid align-start"
          style={{ 
            gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
            gap: "clamp(16px, 2.5vw, 24px)",
          }}
        >
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card-hover"
              style={{ 
                padding: "clamp(20px, 3vw, 32px)",
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div 
                className="rounded-xl bg-secondary border border-border flex items-center justify-center group-hover:border-accent/50 transition-colors duration-500"
                style={{ 
                  width: "clamp(40px, 5vw, 48px)",
                  height: "clamp(40px, 5vw, 48px)",
                  marginBottom: "clamp(16px, 2.5vw, 24px)",
                }}
              >
                <feature.icon 
                  className="text-foreground" 
                  style={{ width: "clamp(18px, 2.5vw, 24px)", height: "clamp(18px, 2.5vw, 24px)" }}
                />
              </div>
              <h3 
                className="font-semibold text-foreground text-wrap-balance"
                style={{ 
                  fontSize: "clamp(1rem, 0.9rem + 0.5vw, 1.25rem)",
                  marginBottom: "clamp(8px, 1.5vw, 12px)",
                }}
              >
                {feature.title}
              </h3>
              <p 
                className="text-muted-foreground leading-relaxed text-break"
                style={{ fontSize: "clamp(0.875rem, 0.8rem + 0.2vw, 1rem)" }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;