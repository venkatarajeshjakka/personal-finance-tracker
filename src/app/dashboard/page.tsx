import { AppLayout } from "@/components/navigation";

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your personal finance tracker. Here&apos;s an overview of your investments.
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Portfolio Value</h3>
            </div>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Active Watchlists</h3>
            </div>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              12 stocks being tracked
            </p>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Today's Gain/Loss</h3>
            </div>
            <div className="text-2xl font-bold text-green-600">+$573.25</div>
            <p className="text-xs text-muted-foreground">
              +1.27% today
            </p>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Companies Tracked</h3>
            </div>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Quarterly data available
            </p>
          </div>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
          <p className="text-muted-foreground">
            Dashboard content will be fully implemented in future tasks.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}