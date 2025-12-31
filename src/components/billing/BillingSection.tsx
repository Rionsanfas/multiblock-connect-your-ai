import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, ExternalLink, Crown, Calendar, Loader2 } from "lucide-react";
import { useBilling, useCustomerPortal } from "@/hooks/useBilling";
import { toast } from "sonner";
import { format } from "date-fns";

// Plan display names mapping
const PLAN_DISPLAY_NAMES: Record<string, string> = {
  'free': 'Free',
  'starter-individual-annual': 'Starter Individual',
  'pro-individual-annual': 'Pro Individual',
  'starter-team-annual': 'Starter Team',
  'pro-team-annual': 'Pro Team',
  'ltd-starter-individual': 'Lifetime Starter',
  'ltd-pro-individual': 'Lifetime Pro',
  'ltd-starter-team': 'Lifetime Starter Team',
  'ltd-pro-team': 'Lifetime Pro Team',
};

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'active':
      return 'default';
    case 'cancelled':
    case 'canceled':
      return 'destructive';
    case 'inactive':
      return 'secondary';
    default:
      return 'outline';
  }
}

function formatPlanName(planKey: string): string {
  return PLAN_DISPLAY_NAMES[planKey] || planKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function BillingSection() {
  const { data: billing, isLoading } = useBilling();
  const { openCustomerPortal } = useCustomerPortal();
  const [isOpening, setIsOpening] = useState(false);

  const handleManageSubscription = async () => {
    setIsOpening(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open billing portal';
      toast.error(message);
    } finally {
      setIsOpening(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-xl border-border/50">
        <CardContent className="pt-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasActiveSubscription = billing?.polar_customer_id && 
    (billing?.subscription_status === 'active' || billing?.is_lifetime);

  return (
    <Card className="settings-card-3d">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="key-icon-3d p-2 rounded-lg">
            <CreditCard className="h-4 w-4" />
          </div>
          Billing & Subscription
        </CardTitle>
        <CardDescription>Manage your subscription and billing details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan Info */}
        <div className="glass-card p-4 rounded-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              <span className="font-semibold">
                {billing?.active_plan ? formatPlanName(billing.active_plan) : 'Free Plan'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant={getStatusBadgeVariant(billing?.subscription_status || 'inactive')}>
                {billing?.is_lifetime ? 'Lifetime' : (billing?.subscription_status || 'inactive')}
              </Badge>
              {billing?.is_lifetime && (
                <span className="text-xs text-muted-foreground">Never expires</span>
              )}
            </div>
          </div>
        </div>

        {/* Renewal Date */}
        {billing?.current_period_end && !billing?.is_lifetime && (
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {billing.subscription_status === 'cancelled' 
                ? 'Access until: ' 
                : 'Next billing date: '}
              <span className="text-foreground font-medium">
                {format(new Date(billing.current_period_end), 'MMMM d, yyyy')}
              </span>
            </span>
          </div>
        )}

        <Separator className="bg-border/30" />

        {/* Manage Subscription Button */}
        <div className="flex flex-col gap-3">
          {hasActiveSubscription ? (
            <Button 
              onClick={handleManageSubscription} 
              disabled={isOpening}
              className="btn-3d-primary w-full"
            >
              {isOpening ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opening Portal...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Subscription
                </>
              )}
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p>No active subscription found.</p>
              <Button variant="link" className="p-0 h-auto text-primary" asChild>
                <a href="/pricing">View pricing plans →</a>
              </Button>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            {hasActiveSubscription 
              ? "You'll be redirected to our billing partner to manage your subscription, view invoices, and update payment methods."
              : "Purchase a plan to access subscription management features."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
