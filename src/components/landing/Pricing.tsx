import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out Multiblock",
    features: [
      "Up to 3 blocks",
      "Basic model connections",
      "Community support",
      "1 workspace",
    ],
    cta: "Get Started",
    href: "#",
    featured: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For individuals who need more power",
    features: [
      "Unlimited blocks",
      "Advanced automations",
      "Priority support",
      "Unlimited workspaces",
      "Custom model configs",
      "Export & sharing",
    ],
    cta: "Get Started",
    href: "#",
    featured: true,
  },
  {
    name: "Teams",
    price: "$49",
    period: "/month",
    description: "For teams building together",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Shared workspaces",
      "Admin controls",
      "SSO integration",
      "Dedicated support",
    ],
    cta: "Get Started",
    href: "#",
    featured: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="section-badge mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-4 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Start free, upgrade when you need more. No hidden fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`glass-card-hover p-8 relative ${
                plan.featured ? 'border-accent/50 bg-card/70' : ''
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-xs font-medium text-background">
                  Most Popular
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {plan.period}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                    <Check size={16} className="text-accent flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={`block text-center w-full py-3 rounded-full font-medium transition-all duration-300 ${
                  plan.featured
                    ? 'btn-primary'
                    : 'btn-outline'
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
