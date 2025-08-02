'use client';

import { DuplicateReport as DuplicateReportType } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, X, Copy } from 'lucide-react';

interface DuplicateReportProps {
  duplicates: DuplicateReportType;
  onClose: () => void;
}

export function DuplicateReport({ duplicates, onClose }: DuplicateReportProps) {
  if (!duplicates || duplicates.totalDuplicates === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <CardTitle className="text-orange-800 dark:text-orange-200">
                Duplicate Companies Detected
              </CardTitle>
              <CardDescription className="text-orange-700 dark:text-orange-300">
                {duplicates.totalDuplicates} duplicate entries found and removed during import
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-orange-600 hover:text-orange-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert className="border-orange-200 bg-orange-100 dark:bg-orange-900/30">
          <Copy className="h-4 w-4" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            Duplicate companies were automatically removed. Only the first occurrence of each symbol was kept.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h4 className="font-medium text-orange-800 dark:text-orange-200">
            Duplicate Details:
          </h4>
          
          <div className="border rounded-lg bg-white dark:bg-gray-950">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Company Names</TableHead>
                  <TableHead>Occurrences</TableHead>
                  <TableHead>Row Numbers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duplicates.duplicates.map((duplicate, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {duplicate.symbol}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {duplicate.companyNames.map((name, nameIndex) => (
                          <div key={nameIndex} className="text-sm">
                            {name}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {duplicate.indices.length}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {duplicate.indices.map((rowIndex, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {rowIndex + 1}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Acknowledge
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}