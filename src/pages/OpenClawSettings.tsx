import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OpenClawSection } from "@/components/dashboard/OpenClawSection";

export default function OpenClawSettings() {
  return (
    <DashboardLayout>
      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-1 mb-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">OpenClaw Connections</h1>
            <p className="text-sm text-muted-foreground">
              Manage your OpenClaw installations connected to Multiblock.
            </p>
          </div>
          <OpenClawSection />
        </div>
      </div>
    </DashboardLayout>
  );
}
