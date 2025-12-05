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
    <section id="how-it-works" className="py-24 relative">
      <div className="gradient-blur w-[500px] h-[500px] bg-accent/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="section-badge mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-4 mb-4">
            Simple. Powerful. Visual.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Get started in minutes with an intuitive workflow designed for builders.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Connector Line (desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-border to-transparent" />
                )}
                
                <div className="glass-card-hover p-6 text-center relative">
                  {/* Number Badge */}
                  <div className="step-number mx-auto mb-6">
                    {step.number}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-secondary/50 border border-border flex items-center justify-center mx-auto mb-4">
                    <step.icon size={24} className="text-foreground" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
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
