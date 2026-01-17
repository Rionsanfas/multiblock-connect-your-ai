import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBilling } from "@/hooks/useBilling";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { usePasswordManagement } from "@/hooks/usePasswordManagement";
import { useDeleteAccount } from "@/hooks/useAccountDeletion";
import { useUserTeams } from "@/hooks/useTeamsData";
import { toast } from "sonner";
import { User, Shield, Cookie, Trash2, Crown, HardDrive, LayoutGrid, Users, Camera, CreditCard, LogOut, Lock, Loader2, AlertTriangle, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { GlassCard } from "@/components/ui/glass-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BillingSection } from "@/components/billing/BillingSection";
import { useAuth } from "@/hooks/useAuth";
import { ADDONS, formatStorage as formatStorageUtil } from "@/config/plans";
import { PolarCheckoutButton } from "@/components/pricing/PolarCheckoutButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { user: authUser, isAuthenticated } = useAuth();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [profileForm, setProfileForm] = useState({
    name: authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || "",
    email: authUser?.email || "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };
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

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="billing" className="space-y-4 sm:space-y-6">
          <TabsList className="tabs-3d flex-wrap h-auto gap-1 p-1 sm:p-1.5 w-full justify-start overflow-x-auto">
            <TabsTrigger value="billing" className="gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm">
              <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 icon-3d" />
              <span className="hidden xs:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="plan" className="gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm">
              <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 icon-3d" />
              <span className="hidden xs:inline">Plan</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 icon-3d" />
              <span className="hidden xs:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm">
              <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 icon-3d" />
              <span className="hidden xs:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="cookies" className="gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm">
              <Cookie className="h-3.5 w-3.5 sm:h-4 sm:w-4 icon-3d" />
              <span className="hidden xs:inline">Cookies</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 icon-3d" />
              <span className="hidden xs:inline">Privacy</span>
            </TabsTrigger>
          </TabsList>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <BillingSection />
          </TabsContent>

          {/* Plan & Usage Tab */}
          <TabsContent value="plan">
            <PlanUsageSection />
          </TabsContent>

          <TabsContent value="profile">
            <Card className="settings-card-3d">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
                  <div className="key-icon-3d p-2 sm:p-2.5 rounded-xl">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  Profile Information
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
                {/* Profile Picture */}
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="relative">
                    <Avatar className="h-16 w-16 sm:h-24 sm:w-24 border-2 border-border ring-2 sm:ring-4 ring-background shadow-lg">
                      <AvatarImage src={profileImage || undefined} alt="Profile" />
                      <AvatarFallback className="text-lg sm:text-2xl bg-secondary/50">
                        {profileForm.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 key-icon-3d p-2 rounded-full"
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
                <Separator className="bg-border/30" />
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Your name"
                    className="bg-secondary/30 border-border/30"
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
                    className="bg-secondary/30 border-border/30"
                  />
                </div>
                <Button onClick={handleProfileSave} className="btn-3d-primary">Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab - Password Management */}
          <TabsContent value="security">
            <SecuritySection userEmail={authUser?.email || ""} />
          </TabsContent>

          <TabsContent value="cookies">
            <Card className="settings-card-3d">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="key-icon-3d p-2.5 rounded-xl">
                    <Cookie className="h-4 w-4" />
                  </div>
                  Cookie Preferences
                </CardTitle>
                <CardDescription>
                  Manage how we use cookies. See our{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  for details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl glass-card">
                  <div className="space-y-0.5">
                    <Label>Essential Cookies</Label>
                    <p className="text-sm text-muted-foreground">
                      Required for basic site functionality
                    </p>
                  </div>
                  <Switch checked={cookies.essential} disabled />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl glass-card">
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
                <Button onClick={handleCookieSave} className="btn-3d-primary">Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="privacy">
            <div className="space-y-6">
              <Card className="settings-card-3d">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="key-icon-3d p-2.5 rounded-xl">
                      <Shield className="h-4 w-4" />
                    </div>
                    Privacy & Data
                  </CardTitle>
                  <CardDescription>Manage your data and privacy settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl glass-card">
                    <div>
                      <p className="font-medium">Privacy Policy</p>
                      <p className="text-sm text-muted-foreground">
                        Read our privacy policy
                      </p>
                    </div>
                    <Button variant="outline" asChild className="key-icon-3d border-0">
                      <Link to="/privacy">View Policy</Link>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl glass-card">
                    <div>
                      <p className="font-medium">Terms of Service</p>
                      <p className="text-sm text-muted-foreground">
                        Read our terms of service
                      </p>
                    </div>
                    <Button variant="outline" asChild className="key-icon-3d border-0">
                      <Link to="/terms">View Terms</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Logout Section */}
              <Card className="bg-card/80 backdrop-blur-xl border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogOut className="h-5 w-5" />
                    Session
                  </CardTitle>
                  <CardDescription>Manage your current session</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Log Out</p>
                      <p className="text-sm text-muted-foreground">
                        Sign out of your account on this device
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Log Out
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone - Account Deletion */}
              <DangerZoneSection />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Security Section Component
function SecuritySection({ userEmail }: { userEmail: string }) {
  const { isLoading, sendPasswordResetEmail, updatePassword } = usePasswordManagement();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    const result = await updatePassword(newPassword);
    if (result.success) {
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleForgotPassword = async () => {
    if (!userEmail) {
      toast.error('No email associated with this account');
      return;
    }
    await sendPasswordResetEmail(userEmail);
  };

  return (
    <div className="space-y-6">
      <Card className="settings-card-3d">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="key-icon-3d p-2.5 rounded-xl">
              <Lock className="h-4 w-4" />
            </div>
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="bg-secondary/30 border-border/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="bg-secondary/30 border-border/30"
            />
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleChangePassword} 
              disabled={isLoading || !newPassword || !confirmPassword}
              className="btn-3d-primary"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
            <Button 
              variant="outline" 
              onClick={handleForgotPassword}
              disabled={isLoading}
            >
              Send Reset Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Danger Zone Section
function DangerZoneSection() {
  const deleteAccount = useDeleteAccount();
  const { data: teams = [] } = useUserTeams();
  const [confirmText, setConfirmText] = useState('');
  
  const ownedTeams = teams.filter(t => t.is_owner);
  const hasOwnedTeams = ownedTeams.length > 0;

  return (
    <Card className="settings-card-3d border-red-500/20 bg-red-500/5">
      <CardHeader>
        <CardTitle className="text-red-400 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <Trash2 className="h-4 w-4" />
          </div>
          Danger Zone
        </CardTitle>
        <CardDescription>
          Irreversible actions for your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasOwnedTeams && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-500">Teams require attention</p>
              <p className="text-sm text-muted-foreground mt-1">
                You own {ownedTeams.length} team(s). You must transfer ownership or delete these teams before deleting your account:
              </p>
              <ul className="mt-2 space-y-1">
                {ownedTeams.map(team => (
                  <li key={team.team_id} className="text-sm">
                    <Link 
                      to={`/team/settings/${team.team_id}`}
                      className="text-primary hover:underline"
                    >
                      {team.team_name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Delete Account</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all data
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                disabled={hasOwnedTeams}
                className="border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400"
              >
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/30">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-400">Delete Account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and all associated data including boards, blocks, messages, and API keys.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2 py-4">
                <Label htmlFor="confirm-delete">Type "DELETE" to confirm</Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="bg-secondary/30 border-border/30"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteAccount.mutate()}
                  disabled={confirmText !== 'DELETE' || deleteAccount.isPending}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  {deleteAccount.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
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

// Helper to format price with cents
const formatPrice = (cents: number): string => {
  const dollars = cents / 100;
  return dollars % 1 === 0 ? `$${dollars.toFixed(0)}` : `$${dollars.toFixed(2)}`;
};

function PlanUsageSection() {
  const { data: billing, isLoading } = useBilling();
  const limits = usePlanLimits();
  
  if (isLoading || limits.isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Card className="bg-card/80 backdrop-blur-xl border-border/50">
          <CardContent className="pt-6">
            <div className="h-40 bg-muted/20 rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const planName = limits.planName;
  const isFree = limits.isFree;
  const isLifetime = limits.isLifetime;
  
  const boardsLimit = limits.boardsLimit;
  const boardsUsed = limits.boardsUsed;
  const storageLimitMb = limits.storageLimitMb;
  const storageUsedMb = 0; // TODO: Get from storage usage hook
  
  const storagePercentage = storageLimitMb > 0 ? Math.min((storageUsedMb / storageLimitMb) * 100, 100) : 0;
  const boardsPercentage = boardsLimit > 0 && boardsLimit !== -1 ? Math.min((boardsUsed / boardsLimit) * 100, 100) : 0;
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
              <p className="font-semibold text-lg">{planName}</p>
              <p className="text-sm text-muted-foreground">
                {isFree ? 'Free forever' : isLifetime ? 'Lifetime access' : 'Annual subscription'}
              </p>
            </div>
            {isFree && (
              <Button asChild>
                <Link to="/pricing">Upgrade Plan</Link>
              </Button>
            )}
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Boards Usage */}
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <LayoutGrid className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Boards</span>
              </div>
              {boardsLimit !== -1 && <Progress value={boardsPercentage} className="h-2 mb-2" />}
              <p className="text-xs text-muted-foreground">
                {boardsUsed} of {boardsLimit === -1 ? 'Unlimited' : boardsLimit} boards used
              </p>
            </GlassCard>

            {/* Storage Usage */}
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <HardDrive className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Storage</span>
              </div>
              <Progress value={storagePercentage} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">
                {formatStorage(storageUsedMb)} of {formatStorage(storageLimitMb)} used
              </p>
            </GlassCard>
          </div>
        </CardContent>
      </Card>

      {/* Available Add-ons */}
      <Card className="bg-card/80 backdrop-blur-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Power-ups
          </CardTitle>
          <CardDescription>Expand your workspace capabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {ADDONS.filter(a => a.is_active).map((addon) => (
              <GlassCard key={addon.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{addon.name}</p>
                    <p className="text-sm text-muted-foreground">{addon.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold">{formatPrice(addon.price_cents)}</p>
                    <p className="text-xs text-muted-foreground">one-time</p>
                  </div>
                  <PolarCheckoutButton 
                    planKey={addon.id} 
                    isAddon={true}
                    className="flex-shrink-0"
                  >
                    <Zap className="h-4 w-4 mr-1.5" />
                    Add
                  </PolarCheckoutButton>
                </div>
              </GlassCard>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
