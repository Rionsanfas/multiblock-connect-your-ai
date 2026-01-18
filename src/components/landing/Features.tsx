import Feature3DIcon from "./Feature3DIcon";
import { AnimatedSection, AnimatedElement } from "./AnimatedSection";

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
      className="relative dot-grid-bg py-12 sm:py-16 md:py-20 lg:py-24"
    >
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimatedSection delay={0} className="text-center mb-8 sm:mb-12 md:mb-16">
          <span className="section-badge mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Features
          </span>
          <h2 className="font-bold text-foreground mt-4 text-wrap-balance text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4">
            Built for AI Power Users
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-break text-sm sm:text-base">
            Everything you need to orchestrate multiple AI models in a single, intuitive workspace.
          </p>
        </AnimatedSection>

        {/* Feature Cards Grid - horizontal scroll on mobile/tablet, grid on desktop */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-6 max-lg:flex max-lg:gap-3 max-lg:overflow-x-auto max-lg:pb-4 max-lg:-mx-4 max-lg:px-4 max-lg:snap-x max-lg:snap-mandatory scrollbar-hide">
          {features.map((feature, index) => (
            <AnimatedElement key={feature.title} delay={index * 150}>
              <div className="glass-card-hover group dot-grid-card h-full p-3 sm:p-4 lg:p-6 pt-2 sm:pt-3 lg:pt-4 max-lg:min-w-[200px] max-lg:max-w-[220px] max-lg:flex-shrink-0 max-lg:snap-center md:max-lg:min-w-[240px] md:max-lg:max-w-[260px]">
                {/* 3D Animated Icon - smaller on mobile/tablet */}
                <div className="relative z-10 max-lg:scale-75 max-lg:origin-center max-lg:-my-2">
                  <Feature3DIcon type={feature.iconType} />
                </div>

                {/* Title */}
                <h3 className="font-semibold text-foreground text-wrap-balance text-center relative z-10 text-sm sm:text-base lg:text-xl mb-1.5 sm:mb-2 lg:mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed text-break text-center relative z-10 text-xs sm:text-sm lg:text-base">
                  {feature.description}
                </p>
              </div>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
