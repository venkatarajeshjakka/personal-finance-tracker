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
  Upload,
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
    name: "Import Data",
    href: "/import",
    icon: Upload,
    description: "Import company data",
  },
  {
    name: "Manage Companies",
    href: "/companies",
    icon: Settings,
    description: "Manage imported companies",
  },
  {
    name: "Stock Prices",
    href: "/stocks",
    icon: TrendingUp,
    description: "Real-time stock prices",
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
        "flex h-full flex-col border-r bg-sidebar transition-all duration-300 relative",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Sidebar header */}
      <div className={cn(
        "flex h-16 items-center border-b relative",
        isCollapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        <div className={cn(
          "flex items-center",
          isCollapsed ? "justify-center" : "space-x-2"
        )}>
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-sm">FT</span>
          </div>
          {!isCollapsed && (
            <span className="font-bold text-sidebar-foreground">Finance Tracker</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hidden md:flex transition-all duration-300",
            isCollapsed
              ? "absolute -right-3 top-4 h-8 w-8 rounded-full border bg-background shadow-md hover:bg-accent z-20"
              : ""
          )}
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
      <nav className={cn("flex-1 space-y-2", isCollapsed ? "p-2" : "p-4")}>
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
                    "flex items-center rounded-lg text-sm font-medium transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    "touch-manipulation group relative", // Better touch support
                    isCollapsed ? "px-2 py-3 justify-center" : "px-3 py-3",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", isCollapsed && "mx-auto")} />
                  {!isCollapsed && (
                    <div className="ml-3 flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs opacity-70">{item.description}</div>
                    </div>
                  )}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-accent text-sidebar-accent-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {item.name}
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
              <div
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground touch-manipulation group relative",
                  isCollapsed ? "px-2 py-3 justify-center" : "px-3 py-3"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isCollapsed && "mx-auto")} />
                {!isCollapsed && <span className="ml-3">{item.name}</span>}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-accent text-sidebar-accent-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </nav>

      {/* Sidebar footer */}
      <div className={cn("border-t", isCollapsed ? "p-2" : "p-4")}>
        <Link href="/settings">
          <div
            className={cn(
              "flex items-center rounded-lg text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground touch-manipulation group relative",
              isCollapsed ? "px-2 py-3 justify-center" : "px-3 py-3"
            )}
            title={isCollapsed ? "Settings" : undefined}
          >
            <Settings className={cn("h-5 w-5 shrink-0", isCollapsed && "mx-auto")} />
            {!isCollapsed && <span className="ml-3">Settings</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-accent text-sidebar-accent-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Settings
              </div>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}