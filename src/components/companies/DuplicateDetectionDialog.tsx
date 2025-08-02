"use client";

import { useState, useEffect } from "react";
import { CompanyFinancials } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { detectDuplicateCompanies, mergeCompanies } from "@/lib/redux/slices/companiesSlice";
import { formatCurrency, formatPercentage } from "@/lib/utils/quarterUtils";
import { 
  AlertTriangle, 
  Calendar, 
  Merge, 
  Search,
  CheckCircle,
  Building
} from "lucide-react";

interface DuplicateDetectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DuplicateDetectionDialog({ 
  open, 
  onOpenChange 
}: DuplicateDetectionDialogProps) {
  const dispatch = useAppDispatch();
  const { duplicates, loading } = useAppSelector(state => state.companies);
  
  const [selectedPrimary, setSelectedPrimary] = useState<{ [groupName: string]: string }>({});
  const [merging, setMerging] = useState(false);

  // Detect duplicates when dialog opens
  useEffect(() => {
    if (open) {
      dispatch(detectDuplicateCompanies());
      setSelectedPrimary({});
    }
  }, [open, dispatch]);

  const duplicateGroups = Object.entries(duplicates);
  const hasDuplicates = duplicateGroups.length > 0;

  const handleMergeGroup = async (groupName: string, companies: CompanyFinancials[]) => {
    const primaryId = selectedPrimary[groupName];
    if (!primaryId) return;

    const duplicateIds = companies
      .filter(c => c.id !== primaryId)
      .map(c => c.id);

    if (duplicateIds.length === 0) return;

    setMerging(true);
    try {
      await dispatch(mergeCompanies({ primaryId, duplicateIds })).unwrap();
      // Re-detect duplicates after merge
      dispatch(detectDuplicateCompanies());
    } catch (error) {
      console.error("Failed to merge companies:", error);
    } finally {
      setMerging(false);
    }
  };

  const handleMergeAll = async () => {
    setMerging(true);
    try {
      for (const [groupName, companies] of duplicateGroups) {
        const primaryId = selectedPrimary[groupName];
        if (!primaryId) continue;

        const duplicateIds = companies
          .filter(c => c.id !== primaryId)
          .map(c => c.id);

        if (duplicateIds.length > 0) {
          await dispatch(mergeCompanies({ primaryId, duplicateIds })).unwrap();
        }
      }
      
      // Re-detect duplicates after all merges
      dispatch(detectDuplicateCompanies());
    } catch (error) {
      console.error("Failed to merge companies:", error);
    } finally {
      setMerging(false);
    }
  };

  const canMergeGroup = (groupName: string) => {
    return selectedPrimary[groupName] !== undefined;
  };

  const canMergeAll = () => {
    return duplicateGroups.every(([groupName]) => canMergeGroup(groupName));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Duplicate Company Detection
          </DialogTitle>
          <DialogDescription>
            Detect and merge duplicate companies to maintain data integrity.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Scanning for duplicates...</div>
          </div>
        ) : !hasDuplicates ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold mb-2">No Duplicates Found</h3>
              <p className="text-muted-foreground">
                All companies in your database appear to be unique.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Found {duplicateGroups.length} group{duplicateGroups.length > 1 ? 's' : ''} of duplicate companies. 
                Select the primary company for each group to keep, and the others will be merged into it.
              </AlertDescription>
            </Alert>

            {duplicateGroups.map(([groupName, companies]) => (
              <Card key={groupName}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Duplicate Group: {groupName}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {companies.length} companies
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => handleMergeGroup(groupName, companies)}
                        disabled={!canMergeGroup(groupName) || merging}
                        className="flex items-center gap-2"
                      >
                        <Merge className="h-4 w-4" />
                        Merge Group
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={selectedPrimary[groupName] || ""}
                    onValueChange={(value) => 
                      setSelectedPrimary(prev => ({ ...prev, [groupName]: value }))
                    }
                  >
                    <div className="space-y-4">
                      {companies.map((company) => (
                        <div key={company.id} className="flex items-start space-x-3">
                          <RadioGroupItem value={company.id} id={company.id} className="mt-1" />
                          <Label htmlFor={company.id} className="flex-1 cursor-pointer">
                            <div className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold">{company.company}</h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  Imported: {new Date(company.createdAt).toLocaleDateString()}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                <div>
                                  <span className="text-muted-foreground">Price:</span>
                                  <div className="font-medium">{formatCurrency(company.price)}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Market Cap:</span>
                                  <div className="font-medium">{company.market_cap}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">P/E Ratio:</span>
                                  <div className="font-medium">{company.PE_ratio}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Quarters:</span>
                                  <div className="font-medium">{Object.keys(company.financials.quarters).length}</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Sales Growth:</span>
                                  <span>{formatPercentage(company.financials.YOY.sales_growth)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">EBIDT Growth:</span>
                                  <span>{formatPercentage(company.financials.YOY.EBIDT_growth)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Profit Growth:</span>
                                  <span>{formatPercentage(company.financials.YOY.net_profit_growth)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">EPS Growth:</span>
                                  <span>{formatPercentage(company.financials.YOY.EPS_growth)}</span>
                                </div>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {hasDuplicates && (
            <Button
              onClick={handleMergeAll}
              disabled={!canMergeAll() || merging}
              className="flex items-center gap-2"
            >
              <Merge className="h-4 w-4" />
              {merging ? "Merging..." : "Merge All Groups"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}