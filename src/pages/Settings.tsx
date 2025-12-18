import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { User, Shield, Cookie, Trash2, Crown, HardDrive, LayoutGrid, Users, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { mockUser, pricingPlans, boardAddons } from "@/mocks/seed";
import { GlassCard } from "@/components/ui/glass-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Settings() {
  const { user } = useAppStore();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
        toast.success("Profile picture updated");
      };
      reader.readAsDataURL(file);
    }
  };

  const [cookies, setCookies] = useState({
    essential: true,
    personalization: true,
  });

  const handleProfileSave = () => {
    toast.success("Profile updated successfully");
  };

  const handleCookieSave = () => {
    toast.success("Cookie preferences saved");
  };

  const handleDeleteAccount = () => {
    toast.error("Account deletion requires confirmation via email");
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="plan" className="space-y-6">
          <TabsList className="tabs-3d flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="plan" className="gap-2">
              <Crown className="h-4 w-4" />
              Plan
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="cookies" className="gap-2">
              <Cookie className="h-4 w-4" />
              Cookies
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="h-4 w-4" />
              Privacy
            </TabsTrigger>
          </TabsList>

          {/* Plan & Usage Tab */}
          <TabsContent value="plan">
            <PlanUsageSection />
          </TabsContent>

          <TabsContent value="profile">
            <Card className="settings-card-3d">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-2 border-border">
                      <AvatarImage src={profileImage || undefined} alt="Profile" />
                      <AvatarFallback className="text-2xl bg-muted">
                        {profileForm.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <p className="font-medium">Profile Picture</p>
                    <p className="text-sm text-muted-foreground">
                      Upload a new profile picture (max 5MB)
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>
                <Button onClick={handleProfileSave}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cookies">
            <Card className="settings-card-3d">
              <CardHeader>
                <CardTitle>Cookie Preferences</CardTitle>
                <CardDescription>
                  Manage how we use cookies. See our{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  for details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Essential Cookies</Label>
                    <p className="text-sm text-muted-foreground">
                      Required for basic site functionality
                    </p>
                  </div>
                  <Switch checked={cookies.essential} disabled />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Personalization Cookies</Label>
                    <p className="text-sm text-muted-foreground">
                      Remember your preferences and settings
                    </p>
                  </div>
                  <Switch
                    checked={cookies.personalization}
                    onCheckedChange={(checked) => setCookies({ ...cookies, personalization: checked })}
                  />
                </div>
                <Button onClick={handleCookieSave}>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="privacy">
            <div className="space-y-6">
              <Card className="settings-card-3d">
                <CardHeader>
                  <CardTitle>Privacy & Data</CardTitle>
                  <CardDescription>Manage your data and privacy settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Privacy Policy</p>
                      <p className="text-sm text-muted-foreground">
                        Read our privacy policy
                      </p>
                    </div>
                    <Button variant="outline" asChild>
                      <Link to="/privacy">View Policy</Link>
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Terms of Service</p>
                      <p className="text-sm text-muted-foreground">
                        Read our terms of service
                      </p>
                    </div>
                    <Button variant="outline" asChild>
                      <Link to="/terms">View Terms</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-destructive/10 border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible actions for your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delete Account</p>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Helper to format storage
const formatStorage = (mb: number): string => {
  if (mb >= 1024) {
    const gb = mb / 1024;
    return `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`;
  }
  return `${mb} MB`;
};

// Helper to format price
const formatPrice = (cents: number): string => {
  return `$${(cents / 100).toFixed(0)}`;
};

function PlanUsageSection() {
  // TODO: Replace with actual user data from Supabase
  const user = mockUser;
  const plan = pricingPlans.find(p => p.id === user.plan);
  
  const storagePercentage = Math.min((user.storage_used_mb / user.storage_limit_mb) * 100, 100);
  const boardsPercentage = Math.min((user.boards_used / user.boards_limit) * 100, 100);
  const isStorageNearLimit = storagePercentage >= 80;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="bg-card/80 backdrop-blur-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Current Plan
          </CardTitle>
          <CardDescription>Your subscription and usage details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div>
              <p className="font-semibold text-lg">{plan?.name || 'Free / Starter'}</p>
              <p className="text-sm text-muted-foreground">
                {plan?.price_cents === 0 ? 'Free forever' : `${formatPrice(plan?.price_cents || 0)}/year`}
              </p>
            </div>
            <Button asChild>
              <Link to="/pricing">Upgrade Plan</Link>
            </Button>
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Boards Usage */}
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <LayoutGrid className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Boards</span>
              </div>
              <Progress value={boardsPercentage} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">
                {user.boards_used} of {user.boards_limit} boards used
              </p>
            </GlassCard>

            {/* Storage Usage */}
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <HardDrive className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Storage</span>
              </div>
              <Progress 
                value={storagePercentage} 
                className={`h-2 mb-2 ${isStorageNearLimit ? '[&>div]:bg-amber-500' : ''}`}
              />
              <p className="text-xs text-muted-foreground">
                {formatStorage(user.storage_used_mb)} of {formatStorage(user.storage_limit_mb)} used
              </p>
              {isStorageNearLimit && (
                <p className="text-xs text-amber-500 mt-1">Approaching storage limit</p>
              )}
            </GlassCard>
          </div>
        </CardContent>
      </Card>

      {/* Board Add-ons */}
      <Card className="bg-card/80 backdrop-blur-xl border-border/50">
        <CardHeader>
          <CardTitle>Board Add-ons</CardTitle>
          <CardDescription>Expand your workspace with extra boards and storage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {boardAddons.map((addon) => (
              <GlassCard key={addon.id} variant="hover" className="p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">+{addon.boards}</div>
                <div className="text-xs text-muted-foreground mb-2">boards</div>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-3">
                  <HardDrive className="h-3 w-3" />
                  +{formatStorage(addon.storage_mb)}
                </div>
                <div className="text-lg font-bold mb-2">{formatPrice(addon.price_cents)}</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => toast.success("Add-on added to cart")}
                >
                  Add
                </Button>
              </GlassCard>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Card className="bg-muted/30 border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <HardDrive className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm mb-1">About Storage</p>
              <p className="text-xs text-muted-foreground">
                Your storage quota covers all your data including messages, block configurations, 
                system prompts, and any files you upload. Storage usage is calculated in real-time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
