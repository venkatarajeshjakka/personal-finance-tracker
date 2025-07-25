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

  // Initialize edited company when dialog opens
  useEffect(() => {
    if (company && open) {
      setEditedCompany({ ...company });
      setErrors([]);
    }
  }, [company, open]);

  const validateCompany = (company: CompanyFinancials): string[] => {
    const errors: string[] = [];

    if (!company.company.trim()) {
      errors.push("Company name is required");
    }

    if (!company.price.trim()) {
      errors.push("Price is required");
    }

    if (!company.market_cap.trim()) {
      errors.push("Market cap is required");
    }

    if (!company.PE_ratio.trim()) {
      errors.push("P/E ratio is required");
    }

    // Validate YOY data
    const yoy = company.financials.YOY;
    if (!yoy.sales_growth.trim()) {
      errors.push("Sales growth is required");
    }
    if (!yoy.EBIDT_growth.trim()) {
      errors.push("EBIDT growth is required");
    }
    if (!yoy.net_profit_growth.trim()) {
      errors.push("Net profit growth is required");
    }
    if (!yoy.EPS_growth.trim()) {
      errors.push("EPS growth is required");
    }

    // Validate quarters data
    const quarters = Object.keys(company.financials.quarters);
    if (quarters.length === 0) {
      errors.push("At least one quarter of data is required");
    }

    return errors;
  };

  const handleSave = () => {
    if (!editedCompany) return;

    const validationErrors = validateCompany(editedCompany);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSave(editedCompany);
    onOpenChange(false);
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
                      value={editedCompany.company}
                      onChange={(e) => handleBasicInfoChange('company', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      value={editedCompany.price}
                      onChange={(e) => handleBasicInfoChange('price', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="market-cap">Market Cap</Label>
                    <Input
                      id="market-cap"
                      value={editedCompany.market_cap}
                      onChange={(e) => handleBasicInfoChange('market_cap', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pe-ratio">P/E Ratio</Label>
                    <Input
                      id="pe-ratio"
                      value={editedCompany.PE_ratio}
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
                      value={editedCompany.financials.YOY.sales_growth}
                      onChange={(e) => handleYOYChange('sales_growth', e.target.value)}
                      placeholder="e.g., 15.5%"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ebidt-growth">EBIDT Growth</Label>
                    <Input
                      id="ebidt-growth"
                      value={editedCompany.financials.YOY.EBIDT_growth}
                      onChange={(e) => handleYOYChange('EBIDT_growth', e.target.value)}
                      placeholder="e.g., 12.3%"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profit-growth">Net Profit Growth</Label>
                    <Input
                      id="profit-growth"
                      value={editedCompany.financials.YOY.net_profit_growth}
                      onChange={(e) => handleYOYChange('net_profit_growth', e.target.value)}
                      placeholder="e.g., 18.7%"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eps-growth">EPS Growth</Label>
                    <Input
                      id="eps-growth"
                      value={editedCompany.financials.YOY.EPS_growth}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}