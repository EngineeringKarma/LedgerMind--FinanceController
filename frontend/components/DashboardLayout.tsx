"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { isLoggedIn, clearToken } from "@/lib/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAuth = isLoggedIn();
    setAuthenticated(isAuth);
    setLoading(false);

    if (!isAuth) {
      router.push("/signin");
    }
  }, [router]);

  const handleLogout = () => {
    clearToken();
    setAuthenticated(false);
    router.push("/signin");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="w-8 h-8 border-2 border-accent-stamp-hover border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 ml-[240px] p-8">
        {children}
      </main>
    </div>
  );
}
