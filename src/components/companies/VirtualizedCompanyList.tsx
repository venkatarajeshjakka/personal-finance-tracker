"use client";

import { memo, useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import { CompanyFinancials } from "@/types";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatPercentage, getGrowthColorClass } from "@/lib/utils/quarterUtils";
import {
    MoreHorizontal,
    Edit,
    Download,
    Trash2,
    AlertTriangle,
    Calendar
} from "lucide-react";

interface DataQualityInfo {
    score: number;
    issues: string[];
    status: 'excellent' | 'good' | 'fair' | 'poor';
}

interface VirtualizedCompanyListProps {
    companies: CompanyFinancials[];
    selectedCompanies: Set<string>;
    onCompanySelect: (companyId: string, checked: boolean) => void;
    onDeleteCompany: (company: CompanyFinancials) => void;
    onExportCompany: (company: CompanyFinancials) => void;
    onEditCompany?: (company: CompanyFinancials) => void;
    height?: number;
    width?: string | number;
}

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

interface CompanyItemProps {
    index: number;
    style: React.CSSProperties;
    data: {
        companies: CompanyFinancials[];
        selectedCompanies: Set<string>;
        onCompanySelect: (companyId: string, checked: boolean) => void;
        onDeleteCompany: (company: CompanyFinancials) => void;
        onExportCompany: (company: CompanyFinancials) => void;
        onEditCompany?: (company: CompanyFinancials) => void;
    };
}

const CompanyItem = memo(({ index, style, data }: CompanyItemProps) => {
    const {
        companies,
        selectedCompanies,
        onCompanySelect,
        onDeleteCompany,
        onExportCompany,
        onEditCompany
    } = data;

    const company = companies[index];
    const dataQuality = assessDataQuality(company);
    const isSelected = selectedCompanies.has(company.id);

    return (
        <div style={style} className="px-4 py-2">
            <div
                className={`border rounded-lg p-4 transition-colors ${isSelected ? 'bg-muted/50 border-primary' : 'hover:bg-muted/30'
                    }`}
            >
                <div className="flex items-start gap-4">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onCompanySelect(company.id, checked as boolean)}
                        className="mt-1"
                    />

                    <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-lg">{company.company}</h3>
                                {getDataQualityBadge(dataQuality)}
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {onEditCompany && (
                                        <DropdownMenuItem onClick={() => onEditCompany(company)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Company
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => onExportCompany(company)}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Export Data
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => onDeleteCompany(company)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Company
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
        </div>
    );
});

CompanyItem.displayName = 'CompanyItem';

export const VirtualizedCompanyList = memo(({
    companies,
    selectedCompanies,
    onCompanySelect,
    onDeleteCompany,
    onExportCompany,
    onEditCompany,
    height = 600,
    width = "100%"
}: VirtualizedCompanyListProps) => {
    const itemData = useMemo(() => ({
        companies,
        selectedCompanies,
        onCompanySelect,
        onDeleteCompany,
        onExportCompany,
        onEditCompany
    }), [companies, selectedCompanies, onCompanySelect, onDeleteCompany, onExportCompany, onEditCompany]);

    // Calculate item height based on content (approximate)
    const ITEM_HEIGHT = 280; // Approximate height for each company item

    if (companies.length === 0) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-center">
                    <div className="text-muted-foreground">No companies to display</div>
                </div>
            </div>
        );
    }

    return (
        <div className="border rounded-lg">
            <List
                height={Math.min(height, companies.length * ITEM_HEIGHT)}
                width={width}
                itemCount={companies.length}
                itemSize={ITEM_HEIGHT}
                itemData={itemData}
                overscanCount={5}
            >
                {CompanyItem}
            </List>
        </div>
    );
});

VirtualizedCompanyList.displayName = 'VirtualizedCompanyList';