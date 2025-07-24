import { AppLayout } from "@/components/navigation";

export default function WatchlistPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Watchlists</h1>
          <p className="text-muted-foreground">
            Track and monitor your favorite stocks and investments.
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">
            Watchlist functionality will be implemented in future tasks.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}