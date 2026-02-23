import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OpenClawSection } from "@/components/dashboard/OpenClawSection";

export default function OpenClawSettings() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">OpenClaw Integration</h1>
          <p className="text-sm text-muted-foreground">
            Connect your local OpenClaw installations to Multiblock.
          </p>
        </div>
        <OpenClawSection />
      </div>
    </DashboardLayout>
  );
}
