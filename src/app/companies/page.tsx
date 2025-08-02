"use client";

import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { 
  loadCompanies, 
  deleteCompany, 
  bulkDeleteCompanies,
  updateCompany
} from "@/lib/redux/slices/companiesSlice";
import { CompanyFinancials } from "@/types";
import { VirtualizedCompanyList } from "@/components/companies/VirtualizedCompanyList";
import { CompanyEditDialog } from "@/components/companies/CompanyEditDialog";
import { DuplicateDetectionDialog } from "@/components/companies/DuplicateDetectionDialog";
import { 
  Search, 
  Trash2, 
  Edit, 
  Download, 
  AlertTriangle,
  Building,
  Filter,
  SortAsc,
  SortDesc,
  Merge,
  Settings,
  Calendar
} from "lucide-react";
import { formatCurrency, formatPercentage, getGrowthColorClass } from "@/lib/utils/quarterUtils";

interface DataQualityInfo {
  score: number;
  issues: string[];
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

export default function CompaniesPage() {
  const dispatch = useAppDispatch();
  const { data: companies, loading, error } = useAppSelector(state => state.companies);
  
  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt' | 'dataQuality'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  
  // State for dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<CompanyFinancials | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<CompanyFinancials | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  // Load companies on mount
  useEffect(() => {
    dispatch(loadCompanies());
  }, [dispatch]);

  // Data quality assessment function
  const assessDataQuality = (company: CompanyFinancials): DataQualityInfo => {
    const issues: string[] = [];
    let score = 100;

    // Check for missing or invalid basic data
    if (!company.price || company.price === "0" || company.price === "₹0") {
      issues.push("Missing or invalid price data");
      score -= 20;
    }
    
    if (!company.market_cap || company.market_cap === "0") {
      issues.push("Missing market cap data");
      score -= 15;
    }
    
    if (!company.PE_ratio || company.PE_ratio === "0") {
      issues.push("Missing P/E ratio data");
      score -= 10;
    }

    // Check YOY growth data
    const yoy = company.financials.YOY;
    if (!yoy.sales_growth || yoy.sales_growth === "0%") {
      issues.push("Missing sales growth data");
      score -= 15;
    }
    if (!yoy.EBIDT_growth || yoy.EBIDT_growth === "0%") {
      issues.push("Missing EBIDT growth data");
      score -= 15;
    }
    if (!yoy.net_profit_growth || yoy.net_profit_growth === "0%") {
      issues.push("Missing net profit growth data");
      score -= 15;
    }
    if (!yoy.EPS_growth || yoy.EPS_growth === "0%") {
      issues.push("Missing EPS growth data");
      score -= 10;
    }

    // Check quarters data
    const quarters = Object.keys(company.financials.quarters);
    if (quarters.length === 0) {
      issues.push("No quarterly data available");
      score -= 30;
    } else if (quarters.length < 4) {
      issues.push(`Only ${quarters.length} quarters of data available`);
      score -= 10;
    }

    // Determine status based on score
    let status: DataQualityInfo['status'];
    if (score >= 90) status = 'excellent';
    else if (score >= 75) status = 'good';
    else if (score >= 50) status = 'fair';
    else status = 'poor';

    return { score: Math.max(0, score), issues, status };
  };

  // Filtered and sorted companies
  const filteredAndSortedCompanies = useMemo(() => {
    const filtered = companies.filter(company =>
      company.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort companies
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number;
      
      switch (sortBy) {
        case 'name':
          aValue = a.company.toLowerCase();
          bValue = b.company.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'dataQuality':
          aValue = assessDataQuality(a).score;
          bValue = assessDataQuality(b).score;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [companies, searchTerm, sortBy, sortOrder]);

  // Performance optimization - use virtualization for large datasets
  const shouldUseVirtualization = filteredAndSortedCompanies.length > 25;

  // Handle individual company selection
  const handleCompanySelect = (companyId: string, checked: boolean) => {
    const newSelected = new Set(selectedCompanies);
    if (checked) {
      newSelected.add(companyId);
    } else {
      newSelected.delete(companyId);
    }
    setSelectedCompanies(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCompanies(new Set(filteredAndSortedCompanies.map(c => c.id)));
    } else {
      setSelectedCompanies(new Set());
    }
  };

  // Handle single company deletion
  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    
    try {
      const result = await dispatch(deleteCompany(companyToDelete.id)).unwrap();
      
      // Show success toast
      const { toast } = await import('sonner');
      toast.success(`Successfully deleted "${result.companyName}"`, { duration: 4000 });
      
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error("Failed to delete company:", error);
      const { toast } = await import('sonner');
      toast.error('Failed to delete company: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Handle bulk deletion
  const handleBulkDelete = async () => {
    try {
      const { toast } = await import('sonner');
      
      // Show progress toast
      const progressToastId = toast.loading(`Deleting ${selectedCompanies.size} companies...`);
      
      const result = await dispatch(bulkDeleteCompanies(Array.from(selectedCompanies))).unwrap();
      
      // Dismiss progress toast
      toast.dismiss(progressToastId);
      
      // Show result toast
      if (result.deletedCount === result.totalRequested) {
        toast.success(`Successfully deleted ${result.deletedCount} companies`, { duration: 4000 });
      } else {
        toast.warning(`Deleted ${result.deletedCount} of ${result.totalRequested} companies. Some deletions may have failed.`, { duration: 6000 });
      }
      
      setSelectedCompanies(new Set());
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete companies:", error);
      const { toast } = await import('sonner');
      toast.error('Failed to delete companies: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Handle company edit
  const handleEditCompany = (company: CompanyFinancials) => {
    setCompanyToEdit(company);
    setEditDialogOpen(true);
  };

  // Handle save edited company
  const handleSaveEditedCompany = async (company: CompanyFinancials) => {
    try {
      await dispatch(updateCompany(company)).unwrap();
      
      // Show success toast
      const { toast } = await import('sonner');
      toast.success(`Successfully updated "${company.company}"`, { duration: 4000 });
    } catch (error) {
      console.error("Failed to update company:", error);
      
      // Show error toast
      const { toast } = await import('sonner');
      toast.error('Failed to update company: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Handle export single company
  const handleExportCompany = (company: CompanyFinancials) => {
    const exportData = {
      company: company,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${company.company.toLowerCase().replace(/\s+/g, '-')}-export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle data export
  const handleExportSelected = () => {
    const selectedCompanyData = companies.filter(c => selectedCompanies.has(c.id));
    const exportData = {
      companies: selectedCompanyData,
      exportDate: new Date().toISOString(),
      totalCompanies: selectedCompanyData.length
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `companies-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get data quality badge
  const getDataQualityBadge = (quality: DataQualityInfo) => {
    const variants = {
      excellent: "default",
      good: "secondary", 
      fair: "outline",
      poor: "destructive"
    } as const;

    return (
      <Badge variant={variants[quality.status]} className="text-xs">
        {quality.status} ({quality.score}%)
      </Badge>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Companies</h1>
            <p className="text-muted-foreground">
              Manage your imported company data, assess data quality, and perform bulk operations.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDuplicateDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Merge className="h-4 w-4" />
              Find Duplicates
            </Button>
            
            {selectedCompanies.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSelected}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Selected ({selectedCompanies.size})
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected ({selectedCompanies.size})
                </Button>
              </>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={sortBy} onValueChange={(value: 'name' | 'createdAt' | 'updatedAt' | 'dataQuality') => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Company Name</SelectItem>
                  <SelectItem value="createdAt">Import Date</SelectItem>
                  <SelectItem value="updatedAt">Last Updated</SelectItem>
                  <SelectItem value="dataQuality">Data Quality</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Companies List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Companies ({filteredAndSortedCompanies.length})
                </CardTitle>
                <CardDescription>
                  Manage your imported company data and assess data quality
                </CardDescription>
              </div>
              
              {filteredAndSortedCompanies.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCompanies.size === filteredAndSortedCompanies.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">Select All</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading companies...</div>
              </div>
            ) : filteredAndSortedCompanies.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    {companies.length === 0 ? "No companies imported yet" : "No companies match your search"}
                  </p>
                </div>
              </div>
            ) : shouldUseVirtualization ? (
              <div className="space-y-4">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    Performance mode enabled for {filteredAndSortedCompanies.length} companies. 
                    Using virtualization for optimal performance.
                  </AlertDescription>
                </Alert>
                <VirtualizedCompanyList
                  companies={filteredAndSortedCompanies}
                  selectedCompanies={selectedCompanies}
                  onCompanySelect={handleCompanySelect}
                  onDeleteCompany={(company) => {
                    setCompanyToDelete(company);
                    setDeleteDialogOpen(true);
                  }}
                  onExportCompany={handleExportCompany}
                  onEditCompany={handleEditCompany}
                  height={600}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedCompanies.map((company) => {
                  const dataQuality = assessDataQuality(company);
                  const isSelected = selectedCompanies.has(company.id);
                  
                  return (
                    <div
                      key={company.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        isSelected ? 'bg-muted/50 border-primary' : 'hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleCompanySelect(company.id, checked as boolean)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">{company.company}</h3>
                              {getDataQualityBadge(dataQuality)}
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCompany(company)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                              <span className={getGrowthColorClass(company.financials.YOY.sales_growth)}>
                                {formatPercentage(company.financials.YOY.sales_growth)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">EBIDT Growth:</span>
                              <span className={getGrowthColorClass(company.financials.YOY.EBIDT_growth)}>
                                {formatPercentage(company.financials.YOY.EBIDT_growth)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Profit Growth:</span>
                              <span className={getGrowthColorClass(company.financials.YOY.net_profit_growth)}>
                                {formatPercentage(company.financials.YOY.net_profit_growth)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">EPS Growth:</span>
                              <span className={getGrowthColorClass(company.financials.YOY.EPS_growth)}>
                                {formatPercentage(company.financials.YOY.EPS_growth)}
                              </span>
                            </div>
                          </div>

                          <Separator />

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Imported: {new Date(company.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Updated: {new Date(company.updatedAt).toLocaleDateString()}
                              </div>
                            </div>
                            
                            {dataQuality.issues.length > 0 && (
                              <div className="flex items-center gap-1 text-amber-600">
                                <AlertTriangle className="h-3 w-3" />
                                {dataQuality.issues.length} issue{dataQuality.issues.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>

                          {dataQuality.issues.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                              <div className="text-sm font-medium text-amber-800 mb-1">Data Quality Issues:</div>
                              <ul className="text-xs text-amber-700 space-y-1">
                                {dataQuality.issues.map((issue, index) => (
                                  <li key={index}>• {issue}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Company Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Company</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{companyToDelete?.company}&quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteCompany}>
                Delete Company
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Dialog */}
        <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Selected Companies</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedCompanies.size} selected companies? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete}>
                Delete {selectedCompanies.size} Companies
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Company Edit Dialog */}
        <CompanyEditDialog
          company={companyToEdit}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleSaveEditedCompany}
        />

        {/* Duplicate Detection Dialog */}
        <DuplicateDetectionDialog
          open={duplicateDialogOpen}
          onOpenChange={setDuplicateDialogOpen}
        />
      </div>
    </AppLayout>
  );
}