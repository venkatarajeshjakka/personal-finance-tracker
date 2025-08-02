"use client";

import { useState, useEffect } from "react";
import { CompanyFinancials, QuarterData } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Save, X } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface CompanyEditDialogProps {
  company: CompanyFinancials | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (company: CompanyFinancials) => void;
}

export function CompanyEditDialog({
  company,
  open,
  onOpenChange,
  onSave
}: CompanyEditDialogProps) {
  const [editedCompany, setEditedCompany] = useState<CompanyFinancials | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  // Initialize edited company when dialog opens
  useEffect(() => {
    if (company && open) {
      // Ensure all fields are properly typed as strings (convert numbers if needed)
      const safeCompany: CompanyFinancials = {
        ...company,
        company: company.company || '', // Only company name is truly required
        // Convert to strings and preserve original values for optional fields
        price: company.price != null ? String(company.price) : company.price,
        market_cap: company.market_cap != null ? String(company.market_cap) : company.market_cap,
        PE_ratio: company.PE_ratio != null ? String(company.PE_ratio) : company.PE_ratio,
        financials: {
          ...company.financials,
          YOY: company.financials?.YOY ? {
            sales_growth: company.financials.YOY.sales_growth != null ? String(company.financials.YOY.sales_growth) : company.financials.YOY.sales_growth,
            EBIDT_growth: company.financials.YOY.EBIDT_growth != null ? String(company.financials.YOY.EBIDT_growth) : company.financials.YOY.EBIDT_growth,
            net_profit_growth: company.financials.YOY.net_profit_growth != null ? String(company.financials.YOY.net_profit_growth) : company.financials.YOY.net_profit_growth,
            EPS_growth: company.financials.YOY.EPS_growth != null ? String(company.financials.YOY.EPS_growth) : company.financials.YOY.EPS_growth
          } : {
            sales_growth: '',
            EBIDT_growth: '',
            net_profit_growth: '',
            EPS_growth: ''
          },
          quarters: company.financials?.quarters || {}
        }
      };
      setEditedCompany(safeCompany);
      setErrors([]);
    }
  }, [company, open]);

  const validateCompany = (company: CompanyFinancials): string[] => {
    const errors: string[] = [];

    // Helper function to safely check string fields
    const isValidString = (value: any): boolean => {
      // Convert numbers to strings for validation
      if (typeof value === 'number') {
        value = value.toString();
      }
      return value != null && typeof value === 'string' && value.trim().length > 0;
    };

    // Helper function to check if a field has meaningful content
    const hasContent = (value: any): boolean => {
      return value != null && value !== '' && value !== undefined;
    };

    console.log('Validating company:', {
      company: company.company,
      price: company.price,
      market_cap: company.market_cap,
      PE_ratio: company.PE_ratio,
      PE_ratio_type: typeof company.PE_ratio
    });

    // Only validate company name as truly required
    if (!isValidString(company.company)) {
      errors.push("Company name is required");
    }

    // For other fields, only validate if they have some content (not empty/null)
    // This allows partial editing without requiring all fields
    if (hasContent(company.price) && !isValidString(company.price)) {
      errors.push("Price cannot be empty if provided");
    }

    if (hasContent(company.market_cap) && !isValidString(company.market_cap)) {
      errors.push("Market cap cannot be empty if provided");
    }

    if (hasContent(company.PE_ratio) && !isValidString(company.PE_ratio)) {
      errors.push("P/E ratio cannot be empty if provided");
    }

    // Validate YOY data only if it exists and has content
    const yoy = company.financials?.YOY;
    if (yoy) {
      if (hasContent(yoy.sales_growth) && !isValidString(yoy.sales_growth)) {
        errors.push("Sales growth cannot be empty if provided");
      }
      if (hasContent(yoy.EBIDT_growth) && !isValidString(yoy.EBIDT_growth)) {
        errors.push("EBIDT growth cannot be empty if provided");
      }
      if (hasContent(yoy.net_profit_growth) && !isValidString(yoy.net_profit_growth)) {
        errors.push("Net profit growth cannot be empty if provided");
      }
      if (hasContent(yoy.EPS_growth) && !isValidString(yoy.EPS_growth)) {
        errors.push("EPS growth cannot be empty if provided");
      }
    }

    console.log('Validation errors:', errors);
    return errors;
  };

  const handleSave = async () => {
    if (!editedCompany || isSaving) return;

    const validationErrors = validateCompany(editedCompany);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      toast.validation.multipleErrors(
        validationErrors.map(error => ({ field: 'Company Data', message: error }))
      );
      return;
    }

    setIsSaving(true);

    try {
      const savePromise = new Promise<void>((resolve, reject) => {
        try {
          onSave(editedCompany);
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      await toast.promise(savePromise, {
        loading: 'Saving company changes...',
        success: `Company "${editedCompany.company}" updated successfully!`,
        error: 'Failed to save company changes'
      });

      onOpenChange(false);
      setErrors([]);
    } catch (error) {
      // Error is already handled by toast.promise
      console.error('Failed to save company:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBasicInfoChange = (field: keyof CompanyFinancials, value: string) => {
    if (!editedCompany) return;

    setEditedCompany({
      ...editedCompany,
      [field]: value
    });
  };

  const handleYOYChange = (field: keyof CompanyFinancials['financials']['YOY'], value: string) => {
    if (!editedCompany) return;

    setEditedCompany({
      ...editedCompany,
      financials: {
        ...editedCompany.financials,
        YOY: {
          ...editedCompany.financials.YOY,
          [field]: value
        }
      }
    });
  };

  const handleQuarterChange = (quarter: string, field: keyof QuarterData, value: string | number) => {
    if (!editedCompany) return;

    const updatedQuarters = { ...editedCompany.financials.quarters };

    if (!updatedQuarters[quarter]) {
      updatedQuarters[quarter] = {
        sales: 0,
        EBIDT: 0,
        net_profit: 0,
        EPS: "0"
      };
    }

    updatedQuarters[quarter] = {
      ...updatedQuarters[quarter],
      [field]: value
    };

    setEditedCompany({
      ...editedCompany,
      financials: {
        ...editedCompany.financials,
        quarters: updatedQuarters
      }
    });
  };

  const addNewQuarter = () => {
    if (!editedCompany) return;

    const newQuarter = `Q${Object.keys(editedCompany.financials.quarters).length + 1}-${new Date().getFullYear()}`;
    handleQuarterChange(newQuarter, 'sales', 0);
  };

  const removeQuarter = (quarter: string) => {
    if (!editedCompany) return;

    const updatedQuarters = { ...editedCompany.financials.quarters };
    delete updatedQuarters[quarter];

    setEditedCompany({
      ...editedCompany,
      financials: {
        ...editedCompany.financials,
        quarters: updatedQuarters
      }
    });
  };

  if (!editedCompany) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Company: {editedCompany.company}</DialogTitle>
          <DialogDescription>
            Update company financial information and quarterly data.
          </DialogDescription>
        </DialogHeader>

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {errors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="yoy">YOY Growth</TabsTrigger>
            <TabsTrigger value="quarters">Quarterly Data</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      value={editedCompany.company || ''}
                      onChange={(e) => handleBasicInfoChange('company', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      value={editedCompany.price || ''}
                      onChange={(e) => handleBasicInfoChange('price', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="market-cap">Market Cap</Label>
                    <Input
                      id="market-cap"
                      value={editedCompany.market_cap || ''}
                      onChange={(e) => handleBasicInfoChange('market_cap', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pe-ratio">P/E Ratio</Label>
                    <Input
                      id="pe-ratio"
                      value={editedCompany.PE_ratio || ''}
                      onChange={(e) => handleBasicInfoChange('PE_ratio', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="yoy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Year-over-Year Growth</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sales-growth">Sales Growth</Label>
                    <Input
                      id="sales-growth"
                      value={editedCompany.financials.YOY.sales_growth || ''}
                      onChange={(e) => handleYOYChange('sales_growth', e.target.value)}
                      placeholder="e.g., 15.5%"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ebidt-growth">EBIDT Growth</Label>
                    <Input
                      id="ebidt-growth"
                      value={editedCompany.financials.YOY.EBIDT_growth || ''}
                      onChange={(e) => handleYOYChange('EBIDT_growth', e.target.value)}
                      placeholder="e.g., 12.3%"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profit-growth">Net Profit Growth</Label>
                    <Input
                      id="profit-growth"
                      value={editedCompany.financials.YOY.net_profit_growth || ''}
                      onChange={(e) => handleYOYChange('net_profit_growth', e.target.value)}
                      placeholder="e.g., 18.7%"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eps-growth">EPS Growth</Label>
                    <Input
                      id="eps-growth"
                      value={editedCompany.financials.YOY.EPS_growth || ''}
                      onChange={(e) => handleYOYChange('EPS_growth', e.target.value)}
                      placeholder="e.g., 16.2%"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quarters" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Quarterly Financial Data</CardTitle>
                  <Button onClick={addNewQuarter} size="sm">
                    Add Quarter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(editedCompany.financials.quarters).map(([quarter, data]) => (
                  <div key={quarter} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{quarter}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuarter(quarter)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${quarter}-sales`}>Sales</Label>
                        <Input
                          id={`${quarter}-sales`}
                          type="number"
                          value={data.sales}
                          onChange={(e) => handleQuarterChange(quarter, 'sales', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${quarter}-ebidt`}>EBIDT</Label>
                        <Input
                          id={`${quarter}-ebidt`}
                          type="number"
                          value={data.EBIDT}
                          onChange={(e) => handleQuarterChange(quarter, 'EBIDT', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${quarter}-profit`}>Net Profit</Label>
                        <Input
                          id={`${quarter}-profit`}
                          type="number"
                          value={data.net_profit}
                          onChange={(e) => handleQuarterChange(quarter, 'net_profit', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${quarter}-eps`}>EPS</Label>
                        <Input
                          id={`${quarter}-eps`}
                          value={data.EPS}
                          onChange={(e) => handleQuarterChange(quarter, 'EPS', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2" disabled={isSaving}>
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}