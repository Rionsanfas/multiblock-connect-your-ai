import { Plus, MessageCircle, Link } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Plus,
    title: "Add Blocks",
    description: "Create a new block for each AI model you want to use. Choose from GPT-4, Claude, Gemini, Mistral, and more.",
  },
  {
    number: "02",
    icon: MessageCircle,
    title: "Chat with Models",
    description: "Interact with each model independently. Compare responses, iterate on prompts, and find the best output.",
  },
  {
    number: "03",
    icon: Link,
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
      {/* Background blur effect - scales with viewport */}
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
        <div 
          className="text-center"
          style={{ marginBottom: "clamp(32px, 5vw, 64px)" }}
        >
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

        {/* Steps - responsive grid with auto-fit */}
        <div className="max-w-4xl mx-auto">
          <div 
            className="grid align-start"
            style={{ 
              gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
              gap: "clamp(16px, 3vw, 32px)",
            }}
          >
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Connector Line (visible on wider screens when cards are in a row) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-border to-transparent" />
                )}
                
                <div 
                  className="glass-card-hover text-center relative"
                  style={{ padding: "clamp(20px, 3vw, 24px)" }}
                >
                  {/* Number Badge */}
                  <div className="step-number mx-auto" style={{ marginBottom: "clamp(16px, 2.5vw, 24px)" }}>
                    {step.number}
                  </div>
                  
                  {/* Icon */}
                  <div 
                    className="rounded-xl bg-secondary/50 border border-border flex items-center justify-center mx-auto"
                    style={{ 
                      width: "clamp(48px, 6vw, 56px)",
                      height: "clamp(48px, 6vw, 56px)",
                      marginBottom: "clamp(12px, 2vw, 16px)",
                    }}
                  >
                    <step.icon 
                      className="text-foreground"
                      style={{ width: "clamp(18px, 2.5vw, 24px)", height: "clamp(18px, 2.5vw, 24px)" }}
                    />
                  </div>
                  
                  <h3 
                    className="font-semibold text-foreground"
                    style={{ 
                      fontSize: "clamp(1rem, 0.9rem + 0.4vw, 1.125rem)",
                      marginBottom: "clamp(8px, 1vw, 12px)",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p 
                    className="text-muted-foreground text-break"
                    style={{ fontSize: "clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)" }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;