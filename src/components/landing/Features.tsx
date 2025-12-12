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
    <section id="features" className="py-16 sm:py-20 md:py-24 relative">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <span className="section-badge mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Features
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-3 sm:mb-4">
            Built for AI Power Users
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto px-2 sm:px-0">
            Everything you need to orchestrate multiple AI models in a single, 
            intuitive workspace.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card-hover p-5 sm:p-6 md:p-8 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-secondary border border-border flex items-center justify-center mb-4 sm:mb-6 group-hover:border-accent/50 transition-colors duration-500">
                <feature.icon size={20} className="text-foreground sm:hidden" />
                <feature.icon size={24} className="text-foreground hidden sm:block" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
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
