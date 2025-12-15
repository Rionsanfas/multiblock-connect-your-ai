import HowItWorks3DIcon from "./HowItWorks3DIcon";

type IconType = "add" | "chat" | "connect";

const steps: { number: string; iconType: IconType; title: string; description: string }[] = [
  {
    number: "01",
    iconType: "add",
    title: "Add Blocks",
    description:
      "Create a new block for each AI model you want to use. Choose from GPT-5, Claude, Gemini, Mistral, and more.",
  },
  {
    number: "02",
    iconType: "chat",
    title: "Chat with Models",
    description:
      "Interact with each model independently. Compare responses, iterate on prompts, and find the best output.",
  },
  {
    number: "03",
    iconType: "connect",
    title: "Connect Them",
    description: "Draw connections between blocks. One model's output becomes another's input—automatically.",
  },
];

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="relative"
      style={{ paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}
    >
      {/* Background blur effect */}
      <div
        className="gradient-blur bg-accent/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute"
        style={{
          width: "clamp(250px, 40vw, 500px)",
          height: "clamp(250px, 40vw, 500px)",
        }}
      />

      {/* Container */}
      <div
        className="relative z-10 w-full max-w-[1200px] mx-auto"
        style={{ paddingLeft: "clamp(16px, 4vw, 32px)", paddingRight: "clamp(16px, 4vw, 32px)" }}
      >
        {/* Header */}
        <div className="text-center" style={{ marginBottom: "clamp(32px, 5vw, 64px)" }}>
          <span className="section-badge mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            How It Works
          </span>
          <h2
            className="font-bold text-foreground mt-4 text-wrap-balance"
            style={{
              fontSize: "clamp(1.5rem, 1rem + 2.5vw, 3rem)",
              marginBottom: "clamp(12px, 2vw, 16px)",
            }}
          >
            Simple. Powerful. Visual.
          </h2>
          <p
            className="text-muted-foreground max-w-xl mx-auto text-break"
            style={{ fontSize: "clamp(0.875rem, 0.8rem + 0.25vw, 1rem)" }}
          >
            Get started in minutes with an intuitive workflow designed for builders.
          </p>
        </div>

        {/* Steps Grid - matching Features layout */}
        <div className="max-w-4xl mx-auto">
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
              gap: "clamp(20px, 2.5vw, 32px)",
              alignItems: "stretch",
            }}
          >
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="glass-card-hover group"
                style={{
                  padding: "clamp(20px, 2.5vw, 28px)",
                  paddingTop: "clamp(12px, 1.5vw, 16px)",
                  opacity: 0,
                  animation: "fadeUp 0.6s ease-out forwards",
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Step Number Badge */}
                <div className="flex justify-center mb-2">
                  <span className="step-number">{step.number}</span>
                </div>

                {/* 3D Animated Icon */}
                <HowItWorks3DIcon type={step.iconType} />

                {/* Title */}
                <h3
                  className="font-semibold text-foreground text-wrap-balance text-center"
                  style={{
                    fontSize: "clamp(1.05rem, 0.95rem + 0.5vw, 1.25rem)",
                    marginBottom: "clamp(10px, 1.5vw, 14px)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p
                  className="text-muted-foreground leading-relaxed text-break text-center"
                  style={{
                    fontSize: "clamp(0.875rem, 0.82rem + 0.2vw, 0.95rem)",
                    lineHeight: 1.6,
                  }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
