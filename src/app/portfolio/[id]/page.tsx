import { AppLayout } from "@/components/navigation";

interface PortfolioDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PortfolioDetailPage({ params }: PortfolioDetailPageProps) {
  const { id } = await params;
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Details</h1>
          <p className="text-muted-foreground">
            Detailed view of portfolio {id}.
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">
            Portfolio {id} details will be implemented in future tasks.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}