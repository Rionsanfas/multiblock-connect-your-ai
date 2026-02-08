import Feature3DIcon from "./Feature3DIcon";
import { AnimatedSection, AnimatedElement } from "./AnimatedSection";
import ConnectionsFeatureCard from "./ConnectionsFeatureCard";

type IconType = "chat" | "connect" | "canvas";

const features: { iconType: IconType; title: string; description: string }[] = [
  {
    iconType: "chat",
    title: "Stop Copy-Pasting Between Chats",
    description:
      "AI blocks share context automatically—no manual copy-paste. Save hours and keep your workflows intact.",
  },
  {
    iconType: "connect",
    title: "Never Hit Token Limits Mid-Flow",
    description:
      "Incremental context sync across connected blocks reduces token waste and prevents interruptions when you're deep in work.",
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

        {/* Feature Cards Grid - 2 columns on desktop with video card spanning */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
          {/* Video Feature Card - Takes prominent position */}
          <AnimatedElement delay={0} className="lg:row-span-2">
            <ConnectionsFeatureCard />
          </AnimatedElement>

          {/* Static Feature Cards */}
          {features.slice(0, 2).map((feature, index) => (
            <AnimatedElement key={feature.title} delay={(index + 1) * 150}>
              <div className="glass-card-hover group dot-grid-card h-full p-4 sm:p-5 lg:p-6 flex flex-col">
                {/* 3D Animated Icon */}
                <div className="relative z-10 mb-3 lg:mb-4 scale-75 lg:scale-100 origin-left -my-2 lg:my-0">
                  <Feature3DIcon type={feature.iconType} />
                </div>

                {/* Title */}
                <h3 className="font-display font-semibold text-foreground text-wrap-balance text-sm sm:text-base lg:text-lg mb-2 lg:mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed text-break text-xs sm:text-sm lg:text-base flex-1">
                  {feature.description}
                </p>
              </div>
            </AnimatedElement>
          ))}
        </div>

        {/* Third feature card - full width below */}
        <div className="mt-4 sm:mt-5 lg:mt-6">
          <AnimatedElement delay={450}>
            <div className="glass-card-hover group dot-grid-card p-4 sm:p-5 lg:p-6 lg:flex lg:items-center lg:gap-6">
              {/* 3D Animated Icon */}
              <div className="relative z-10 mb-3 lg:mb-0 scale-75 lg:scale-100 origin-left -my-2 lg:my-0 lg:flex-shrink-0">
                <Feature3DIcon type={features[2].iconType} />
              </div>

              <div className="lg:flex-1">
                {/* Title */}
                <h3 className="font-display font-semibold text-foreground text-wrap-balance text-sm sm:text-base lg:text-lg mb-2">
                  {features[2].title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed text-break text-xs sm:text-sm lg:text-base">
                  {features[2].description}
                </p>
              </div>
            </div>
          </AnimatedElement>
        </div>
      </div>
    </section>
  );
};

export default Features;
