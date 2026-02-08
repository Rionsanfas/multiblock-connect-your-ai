import Feature3DIcon from "./Feature3DIcon";
import { AnimatedSection, AnimatedElement } from "./AnimatedSection";
import ConnectionsFeatureCard from "./ConnectionsFeatureCard";
import MemoryFeatureCard from "./MemoryFeatureCard";

type IconType = "chat" | "connect" | "canvas";

const features: { iconType: IconType; title: string; description: string }[] = [
  {
    iconType: "chat",
    title: "Stop Copy-Pasting Between Chats",
    description:
      "AI blocks share context automatically—no manual copy-paste. Save hours and keep your workflows intact.",
  },
  {
    iconType: "canvas",
    title: "See Your Entire Workflow at Once",
    description: "Visual boards make complex AI pipelines easy to manage. No more fragmented chats scattered across tabs.",
  },
];

const Features = () => {
  return (
    <section
      id="features"
      className="relative dot-grid-bg py-12 sm:py-16 md:py-20 lg:py-24 mt-8 sm:mt-0"
    >
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimatedSection delay={0} className="text-center mb-8 sm:mb-12 md:mb-16">
          <span className="section-badge mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Features
          </span>
          <h2 className="font-display italic font-bold text-foreground mt-4 text-wrap-balance text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4">
            The Problems We Solve
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-break text-sm sm:text-base">
            Without structured context, you'll keep losing time, hitting limits, and working in fragmented chats.
          </p>
        </AnimatedSection>

        {/* Feature Cards Grid - 2 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
          {/* Video Feature Card */}
          <AnimatedElement delay={0}>
            <ConnectionsFeatureCard />
          </AnimatedElement>

          {/* Memory Feature Card */}
          <AnimatedElement delay={150}>
            <MemoryFeatureCard />
          </AnimatedElement>
        </div>

        {/* Bottom row — two text feature cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 mt-4 sm:mt-5 lg:mt-6">
          {features.map((feature, index) => (
            <AnimatedElement key={feature.title} delay={(index + 2) * 150}>
              <div className="glass-card-hover group dot-grid-card h-full p-4 sm:p-5 lg:p-6 lg:flex lg:items-center lg:gap-6">
                <div className="relative z-10 mb-3 lg:mb-0 scale-75 lg:scale-100 origin-left -my-2 lg:my-0 lg:flex-shrink-0">
                  <Feature3DIcon type={feature.iconType} />
                </div>
                <div className="lg:flex-1">
                  <h3 className="font-display font-semibold text-foreground text-wrap-balance text-sm sm:text-base lg:text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-break text-xs sm:text-sm lg:text-base">
                    {feature.description}
                  </p>
                </div>
              </div>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
