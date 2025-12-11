import { useState } from "react";
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
import { User, Shield, Cookie, Bell, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Settings() {
  const { user } = useAppStore();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [cookies, setCookies] = useState({
    essential: true,
    analytics: true,
    personalization: true,
    marketing: false,
  });

  const [notifications, setNotifications] = useState({
    email: true,
    browser: false,
    updates: true,
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

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-card/50 border border-border/50">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="cookies" className="gap-2">
              <Cookie className="h-4 w-4" />
              Cookies
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="h-4 w-4" />
              Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="bg-card/80 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
            <Card className="bg-card/80 backdrop-blur-xl border-border/50">
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
                    <Label>Analytics Cookies</Label>
                    <p className="text-sm text-muted-foreground">
                      Help us understand how you use the site
                    </p>
                  </div>
                  <Switch
                    checked={cookies.analytics}
                    onCheckedChange={(checked) => setCookies({ ...cookies, analytics: checked })}
                  />
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
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Cookies</Label>
                    <p className="text-sm text-muted-foreground">
                      Used for targeted advertising
                    </p>
                  </div>
                  <Switch
                    checked={cookies.marketing}
                    onCheckedChange={(checked) => setCookies({ ...cookies, marketing: checked })}
                  />
                </div>
                <Button onClick={handleCookieSave}>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="bg-card/80 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates and alerts via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Browser Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={notifications.browser}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, browser: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Product Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Be notified about new features and improvements
                    </p>
                  </div>
                  <Switch
                    checked={notifications.updates}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, updates: checked })}
                  />
                </div>
                <Button onClick={() => toast.success("Notification settings saved")}>
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <div className="space-y-6">
              <Card className="bg-card/80 backdrop-blur-xl border-border/50">
                <CardHeader>
                  <CardTitle>Privacy & Data</CardTitle>
                  <CardDescription>Manage your data and privacy settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Download Your Data</p>
                      <p className="text-sm text-muted-foreground">
                        Get a copy of all your data
                      </p>
                    </div>
                    <Button variant="outline">Request Download</Button>
                  </div>
                  <Separator />
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
