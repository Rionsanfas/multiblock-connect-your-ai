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
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="section-badge mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Features
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-4 mb-4">
            Built for AI Power Users
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything you need to orchestrate multiple AI models in a single, 
            intuitive workspace.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card-hover p-8 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center mb-6 group-hover:border-accent/50 transition-colors duration-500">
                <feature.icon size={24} className="text-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
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
