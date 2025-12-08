import { useNavigate } from "react-router-dom";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useAppStore } from "@/store/useAppStore";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { toast } from "sonner";

export default function Pricing() {
  const navigate = useNavigate();
  const { ltdOffers, isAuthenticated } = useAppStore();

  const handleBuy = (sku: string) => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    toast.success("Redirecting to checkout...");
    navigate(`/checkout?sku=${sku}`);
  };

  return (
    <div className="min-h-screen noise-bg">
      <Navbar />
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-badge mb-4">
              <Zap className="h-4 w-4" />
              Limited Time Offer
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Lifetime Access Deals
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              One-time payment, lifetime access. No subscriptions, no recurring fees.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ltdOffers.map((offer) => (
              <GlassCard
                key={offer.sku}
                variant="hover"
                glow={offer.highlight}
                className={`p-6 relative ${offer.highlight ? "ring-2 ring-primary/50" : ""}`}
              >
                {offer.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                    Most Popular
                  </div>
                )}

                <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{offer.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">${offer.price_cents / 100}</span>
                    <span className="text-muted-foreground line-through">
                      ${offer.original_price_cents / 100}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">One-time payment</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {offer.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleBuy(offer.sku)}
                  className="w-full"
                  variant={offer.highlight ? "default" : "outline"}
                >
                  Get {offer.title}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  {offer.total_quantity - offer.sold} of {offer.total_quantity} remaining
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
