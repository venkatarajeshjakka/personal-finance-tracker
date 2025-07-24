"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Eye,
  Briefcase,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview and insights",
  },
  {
    name: "Watchlists",
    href: "/watchlist",
    icon: Eye,
    description: "Track your stocks",
  },
  {
    name: "Portfolios",
    href: "/portfolio",
    icon: Briefcase,
    description: "Manage investments",
  },
  {
    name: "Analytics",
    href: "/portfolio/analytics",
    icon: BarChart3,
    description: "Performance insights",
  },
];

const quickActions = [
  {
    name: "Market Trends",
    href: "/trends",
    icon: TrendingUp,
  },
  {
    name: "My Wallet",
    href: "/wallet",
    icon: Wallet,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Sidebar header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-sm">FT</span>
            </div>
            <span className="font-bold text-sidebar-foreground">Finance Tracker</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hidden md:flex"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        <div className="space-y-1">
          {!isCollapsed && (
            <h3 className="px-2 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
              Navigation
            </h3>
          )}
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    "touch-manipulation", // Better touch support
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <div className="ml-3 flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs opacity-70">{item.description}</div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <Separator className="my-4" />

        {/* Quick Actions */}
        <div className="space-y-1">
          {!isCollapsed && (
            <h3 className="px-2 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
              Quick Actions
            </h3>
          )}
          {quickActions.map((item) => (
            <Link key={item.name} href={item.href}>
              <div className="flex items-center rounded-lg px-3 py-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground touch-manipulation">
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="ml-3">{item.name}</span>}
              </div>
            </Link>
          ))}
        </div>
      </nav>

      {/* Sidebar footer */}
      <div className="border-t p-4">
        <Link href="/settings">
          <div className="flex items-center rounded-lg px-3 py-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground touch-manipulation">
            <Settings className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span className="ml-3">Settings</span>}
          </div>
        </Link>
      </div>
    </div>
  );
}