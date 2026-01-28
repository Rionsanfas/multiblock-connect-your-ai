import Feature3DIcon from "./Feature3DIcon";
import { AnimatedSection, AnimatedElement } from "./AnimatedSection";

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
          <h2 className="font-bold text-foreground mt-4 text-wrap-balance text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4">
            The Problems We Solve
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-break text-sm sm:text-base">
            Without structured context, you'll keep losing time, hitting limits, and working in fragmented chats.
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
