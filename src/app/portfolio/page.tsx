import { AppLayout } from "@/components/navigation";

export default function PortfolioPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolios</h1>
          <p className="text-muted-foreground">
            Manage and track your investment portfolios.
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">
            Portfolio management functionality will be implemented in future tasks.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}