import Feature3DIcon from "./Feature3DIcon";

type IconType = "chat" | "connect" | "canvas";

const features: { iconType: IconType; title: string; description: string }[] = [
  {
    iconType: "chat",
    title: "Multi-Model Chat Workspace",
    description:
      "Chat with GPT-5, Claude, Gemini, and more—all in one unified interface. Switch models instantly without juggling tabs.",
  },
  {
    iconType: "connect",
    title: "Connect Blocks to Automate",
    description:
      "Link model outputs together. Let one AI's response feed into another, creating powerful automated workflows.",
  },
  {
    iconType: "canvas",
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
      <div
        className="w-full max-w-[1200px] mx-auto"
        style={{ paddingLeft: "clamp(16px, 4vw, 32px)", paddingRight: "clamp(16px, 4vw, 32px)" }}
      >
        {/* Header */}
        <div className="text-center" style={{ marginBottom: "clamp(40px, 6vw, 72px)" }}>
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
            Everything you need to orchestrate multiple AI models in a single, intuitive workspace.
          </p>
        </div>

        {/* Premium Glassmorphism Feature Cards Grid with 3D Icons */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
            gap: "clamp(20px, 2.5vw, 32px)",
            alignItems: "stretch",
          }}
        >
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card-hover group"
              style={{
                padding: "clamp(20px, 2.5vw, 28px)",
                paddingTop: "clamp(12px, 1.5vw, 16px)",
                opacity: 0,
                animation: "fadeUp 0.6s ease-out forwards",
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* 3D Animated Icon */}
              <Feature3DIcon type={feature.iconType} />

              {/* Title */}
              <h3
                className="font-semibold text-foreground text-wrap-balance text-center"
                style={{
                  fontSize: "clamp(1.05rem, 0.95rem + 0.5vw, 1.25rem)",
                  marginBottom: "clamp(10px, 1.5vw, 14px)",
                  letterSpacing: "-0.01em",
                }}
              >
                {feature.title}
              </h3>

              {/* Description */}
              <p
                className="text-muted-foreground leading-relaxed text-break text-center"
                style={{
                  fontSize: "clamp(0.875rem, 0.82rem + 0.2vw, 0.95rem)",
                  lineHeight: 1.6,
                }}
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
