"use client";

import { Suspense } from "react";
import DashboardContent from "./DashboardContent";
import DashboardLayout from "@/components/DashboardLayout";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-accent-stamp-hover border-t-transparent rounded-full animate-spin" />
              <p className="text-text-muted text-sm">Loading dashboard...</p>
            </div>
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </DashboardLayout>
  );
}
