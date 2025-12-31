import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  ExternalLink, 
  Crown, 
  Calendar, 
  Loader2, 
  Receipt, 
  Settings2, 
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Infinity,
  LayoutGrid,
  HardDrive,
  Users,
  Zap
} from "lucide-react";
import { useBilling, useCustomerPortal } from "@/hooks/useBilling";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

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

function formatStorage(gb: number): string {
  if (gb === -1) return 'Unlimited';
  return `${gb} GB`;
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
  
  const isFree = !billing?.active_plan || billing?.active_plan === 'free';
  const isLifetime = billing?.is_lifetime;
  const isCancelled = billing?.subscription_status === 'cancelled' || billing?.subscription_status === 'canceled';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Subscription Card */}
      <Card className="settings-card-3d overflow-hidden">
        <CardHeader className="p-4 sm:p-6 pb-0 sm:pb-0">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="key-icon-3d p-1.5 sm:p-2 rounded-lg">
              <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            Billing & Subscription
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Manage your subscription, payment methods, and invoices
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Current Plan Banner */}
          <div className={`rounded-xl p-4 sm:p-5 ${
            isFree 
              ? 'bg-muted/50 border border-border/50' 
              : isLifetime 
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30'
                : 'bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 sm:p-2.5 rounded-lg ${
                  isFree ? 'bg-muted' : isLifetime ? 'bg-amber-500/20' : 'bg-primary/20'
                }`}>
                  <Crown className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    isFree ? 'text-muted-foreground' : isLifetime ? 'text-amber-500' : 'text-primary'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">
                    {billing?.active_plan ? formatPlanName(billing.active_plan) : 'Free Plan'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <Badge 
                      variant={getStatusBadgeVariant(billing?.subscription_status || 'inactive')} 
                      className="text-xs"
                    >
                      {isLifetime ? 'Lifetime' : isCancelled ? 'Cancelled' : (billing?.subscription_status || 'inactive')}
                    </Badge>
                    {isLifetime && (
                      <span className="text-xs text-amber-500 flex items-center gap-1">
                        <Infinity className="h-3 w-3" />
                        Never expires
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {isFree && (
                <Button asChild size="sm" className="btn-3d-primary w-full sm:w-auto">
                  <Link to="/pricing">
                    <Zap className="h-4 w-4 mr-1.5" />
                    Upgrade Plan
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Billing Period / Next Payment */}
          {!isFree && !isLifetime && billing?.current_period_end && (
            <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-muted/30 border border-border/30">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isCancelled ? 'Access ends on' : 'Next billing date'}
                </p>
                <p className="font-medium text-sm sm:text-base truncate">
                  {format(new Date(billing.current_period_end), 'MMMM d, yyyy')}
                </p>
              </div>
              {isCancelled && (
                <Badge variant="outline" className="text-amber-500 border-amber-500/30 flex-shrink-0">
                  Ending Soon
                </Badge>
              )}
            </div>
          )}

          {/* Plan Entitlements Quick View */}
          {billing && !isFree && (
            <>
              <Separator className="bg-border/30" />
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Your Plan Includes
                </h4>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-muted/30 border border-border/30">
                    <LayoutGrid className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Boards</p>
                      <p className="font-medium text-sm truncate">
                        {billing.total_boards === -1 ? 'Unlimited' : billing.total_boards}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-muted/30 border border-border/30">
                    <HardDrive className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Storage</p>
                      <p className="font-medium text-sm truncate">
                        {formatStorage(billing.total_storage_gb)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-muted/30 border border-border/30">
                    <Users className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Team Seats</p>
                      <p className="font-medium text-sm truncate">{billing.seats}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-muted/30 border border-border/30">
                    <Infinity className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Blocks</p>
                      <p className="font-medium text-sm truncate">
                        {billing.blocks === -1 ? 'Unlimited' : billing.blocks}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Applied Add-ons */}
          {billing?.applied_addons && billing.applied_addons.length > 0 && (
            <>
              <Separator className="bg-border/30" />
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Active Add-ons ({billing.applied_addons.length})
                </h4>
                <div className="space-y-2">
                  {billing.applied_addons.map((addon, index) => (
                    <div 
                      key={addon.addon_id + index} 
                      className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded bg-amber-500/20">
                          <Zap className="h-3 w-3 text-amber-500" />
                        </div>
                        <span className="text-xs sm:text-sm truncate">
                          +{addon.extra_boards} Boards, +{addon.extra_storage_gb}GB Storage
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
                        {format(new Date(addon.purchased_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator className="bg-border/30" />

          {/* Action Buttons */}
          <div className="space-y-3">
            {hasActiveSubscription ? (
              <>
                {/* Primary Portal Button */}
                <Button 
                  onClick={handleManageSubscription} 
                  disabled={isOpening}
                  className="btn-3d-primary w-full"
                  size="lg"
                >
                  {isOpening ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Opening Portal...
                    </>
                  ) : (
                    <>
                      <Settings2 className="h-4 w-4 mr-2" />
                      Manage Subscription
                    </>
                  )}
                </Button>

                {/* Secondary Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleManageSubscription}
                    disabled={isOpening}
                    className="key-icon-3d border-0 justify-start h-auto py-3"
                  >
                    <Receipt className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="text-left">
                      <p className="text-sm font-medium">View Invoices</p>
                      <p className="text-xs text-muted-foreground">Download receipts</p>
                    </div>
                    <ArrowUpRight className="h-3 w-3 ml-auto text-muted-foreground" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleManageSubscription}
                    disabled={isOpening}
                    className="key-icon-3d border-0 justify-start h-auto py-3"
                  >
                    <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="text-left">
                      <p className="text-sm font-medium">Payment Methods</p>
                      <p className="text-xs text-muted-foreground">Update card info</p>
                    </div>
                    <ArrowUpRight className="h-3 w-3 ml-auto text-muted-foreground" />
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  You'll be redirected to our secure billing partner to manage your subscription.
                </p>
              </>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">No active subscription</span>
                </div>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Upgrade to a paid plan to access subscription management, invoices, and payment settings.
                </p>
                <Button asChild className="btn-3d-primary">
                  <Link to="/pricing">
                    <Zap className="h-4 w-4 mr-2" />
                    View Plans & Pricing
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Help Card */}
      <Card className="bg-muted/30 border-border/30">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <ExternalLink className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm">Need help with billing?</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Contact our support team for any billing questions or issues.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
              <a href="mailto:support@example.com">
                Contact Support
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}