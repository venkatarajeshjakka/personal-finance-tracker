"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Upload, Eye, Calendar } from "lucide-react";

interface EmptyStateProps {
  type: 'no-companies' | 'no-quarter-data';
  quarterKey?: string;
  availableQuarters?: Array<{ displayName: string }>;
  onQuarterChange?: (quarter: string) => void;
}

export function EmptyState({ 
  type, 
  quarterKey, 
  availableQuarters = [], 
  onQuarterChange 
}: EmptyStateProps) {
  if (type === 'no-companies') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Company Data</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Get started by importing your company financial data. You can import single companies or multiple companies at once.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/import" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import Company Data
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/watchlist" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Create Watchlist
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'no-quarter-data') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Data for {quarterKey}</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            No companies have financial data available for the selected quarter. Try selecting a different quarter or import more recent data.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/import" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import More Data
              </Link>
            </Button>
            {availableQuarters.length > 0 && onQuarterChange && (
              <Button 
                variant="outline" 
                onClick={() => onQuarterChange(availableQuarters[0].displayName)}
              >
                View {availableQuarters[0].displayName}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}