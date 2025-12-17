import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";

interface DashboardLayoutProps {
  children: ReactNode;
  boardId?: string;
  boardTitle?: string;
  showBoardControls?: boolean;
  hideSidebar?: boolean;
}

export function DashboardLayout({
  children,
  boardId,
  boardTitle,
  showBoardControls = false,
  hideSidebar = false,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-background noise-bg">
      {!hideSidebar && <AppSidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          boardId={boardId}
          boardTitle={boardTitle}
          showBoardControls={showBoardControls}
        />
        <main className="flex-1 overflow-auto relative">{children}</main>
      </div>
    </div>
  );
}
