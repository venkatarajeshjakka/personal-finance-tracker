import { AppLayout } from "@/components/navigation";

export default function PortfolioAnalyticsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights and performance analysis of your portfolios.
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">
            Portfolio analytics functionality will be implemented in future tasks.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}