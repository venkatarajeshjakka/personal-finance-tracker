"use client";

import { useState } from "react";
import { AppLayout } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { importCompanyData } from "@/lib/redux/slices/companiesSlice";
import { CompanyFinancials } from "@/types";
import { formatCurrency, formatPercentage, getGrowthColorClass } from "@/lib/utils/quarterUtils";
import { Upload, Eye, AlertCircle, CheckCircle, FileText } from "lucide-react";

export default function ImportPage() {
    const [jsonInput, setJsonInput] = useState("");
    const [previewData, setPreviewData] = useState<CompanyFinancials[] | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector(state => state.companies);

    const validateAndPreview = () => {
        try {
            setValidationError(null);

            if (!jsonInput.trim()) {
                setValidationError("Please enter JSON data");
                return;
            }

            const parsed = JSON.parse(jsonInput);

            // Validate structure
            let companies: any[] = [];

            console.log('Parsed data:', parsed);
            console.log('parsed.company:', parsed.company, 'type:', typeof parsed.company);
            console.log('parsed.financials:', !!parsed.financials);

            if (parsed.financials && parsed.company && typeof parsed.company === 'string') {
                // Direct single company format: { "company": "Name", "financials": {...} }
                console.log('Using direct company format');
                companies = [parsed];
            } else if (parsed.company && typeof parsed.company === 'object') {
                // Nested single company format: { "company": { ... } }
                console.log('Using nested company format');
                companies = [parsed.company];
            } else if (parsed.companies && Array.isArray(parsed.companies)) {
                // Multiple companies format: { "companies": [...] }
                console.log('Using multiple companies format');
                companies = parsed.companies;
            } else {
                throw new Error("Invalid JSON structure. Expected 'company' object, 'companies' array, or direct company data");
            }

            // Validate each company
            const validatedCompanies: CompanyFinancials[] = companies.map((company, index) => {
                console.log(`Validating company ${index + 1}:`, company);
                
                // Handle both 'name' field and 'company' field as string
                const companyName = company.name || (typeof company.company === 'string' ? company.company : null);
                
                console.log(`Company name extracted: "${companyName}" from:`, {
                    name: company.name,
                    company: company.company,
                    companyType: typeof company.company
                });
                
                if (!companyName) {
                    throw new Error(`Company ${index + 1}: Missing 'name' or 'company' field`);
                }
                if (!company.financials?.quarters) {
                    throw new Error(`Company ${index + 1}: Missing 'financials.quarters' data`);
                }

                const now = new Date();
                return {
                    id: `${companyName.toLowerCase().replace(/\s+/g, '-')}-${now.getTime()}`,
                    company: companyName,
                    price: company.price || "0",
                    market_cap: company.market_cap || "0",
                    PE_ratio: company.PE_ratio || "0",
                    financials: {
                        YOY: company.financials.YOY || {
                            sales_growth: "0%",
                            EBIDT_growth: "0%",
                            net_profit_growth: "0%",
                            EPS_growth: "0%"
                        },
                        quarters: company.financials.quarters
                    },
                    createdAt: now,
                    updatedAt: now
                };
            });

            setPreviewData(validatedCompanies);
            setShowPreview(true);
        } catch (error) {
            setValidationError(error instanceof Error ? error.message : "Invalid JSON format");
            setPreviewData(null);
            setShowPreview(false);
        }
    };

    const handleImport = async () => {
        if (!previewData) return;

        try {
            // Import each company
            for (const company of previewData) {
                await dispatch(importCompanyData(company)).unwrap();
            }

            // Clear form on success
            setJsonInput("");
            setPreviewData(null);
            setShowPreview(false);
            setValidationError(null);
        } catch (error) {
            console.error("Import failed:", error);
        }
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Import Company Data</h1>
                    <p className="text-muted-foreground">
                        Import financial data for companies in JSON format. Supports direct company format, nested company format, and multiple companies format.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Input Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                JSON Input
                            </CardTitle>
                            <CardDescription>
                                Paste your company financial data in JSON format
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder={`Example format:
{
  "company": "Persistent Sys",
  "price": "₹5,606",
  "market_cap": "₹87,665 Cr",
  "PE_ratio": "57.7",
  "financials": {
    "YOY": {
      "sales_growth": "22%",
      "EBIDT_growth": "34%",
      "net_profit_growth": "39%",
      "EPS_growth": "37%"
    },
    "quarters": {
      "Jun 2025": {
        "sales": 3334,
        "EBIDT": 612,
        "net_profit": 425,
        "EPS": "₹27.17"
      },
      "Mar 2025": {
        "sales": 3242,
        "EBIDT": 584,
        "net_profit": 396,
        "EPS": "₹25.59"
      }
    }
  }
}`}
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                className="min-h-[300px] font-mono text-sm"
                            />

                            {validationError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{validationError}</AlertDescription>
                                </Alert>
                            )}

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    onClick={validateAndPreview}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <Eye className="h-4 w-4" />
                                    Preview
                                </Button>

                                {previewData && (
                                    <Button
                                        onClick={handleImport}
                                        disabled={loading}
                                        className="flex items-center gap-2"
                                    >
                                        <Upload className="h-4 w-4" />
                                        {loading ? "Importing..." : "Import Data"}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5" />
                                Preview
                            </CardTitle>
                            <CardDescription>
                                Preview of the data that will be imported
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!showPreview && (
                                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                    <div className="text-center">
                                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Click "Preview" to validate and preview your JSON data</p>
                                    </div>
                                </div>
                            )}

                            {showPreview && previewData && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="text-sm text-green-600">
                                            {previewData.length} company(ies) ready to import
                                        </span>
                                    </div>

                                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                        {previewData.map((company, index) => (
                                            <div key={index} className="border rounded-lg p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold">{company.company}</h3>
                                                    <Badge variant="outline">
                                                        {Object.keys(company.financials.quarters).length} quarters
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Price:</span>
                                                        <span className="ml-2">{formatCurrency(company.price)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">P/E:</span>
                                                        <span className="ml-2">{company.PE_ratio}</span>
                                                    </div>
                                                </div>

                                                <Separator />

                                                <div className="grid grid-cols-2 gap-2 text-sm">
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

                                                <div className="text-xs text-muted-foreground">
                                                    Quarters: {Object.keys(company.financials.quarters).join(", ")}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Format Examples */}
                <Card>
                    <CardHeader>
                        <CardTitle>Supported Formats</CardTitle>
                        <CardDescription>
                            Examples of valid JSON formats for importing company data
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <h4 className="font-medium mb-2">Direct Company Format</h4>
                                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                                    {`{
  "company": "Persistent Sys",
  "price": "₹5,606",
  "market_cap": "₹87,665 Cr",
  "PE_ratio": "57.7",
  "financials": {
    "YOY": {
      "sales_growth": "22%",
      "EBIDT_growth": "34%",
      "net_profit_growth": "39%",
      "EPS_growth": "37%"
    },
    "quarters": {
      "Jun 2025": {
        "sales": 3334,
        "EBIDT": 612,
        "net_profit": 425,
        "EPS": "₹27.17"
      }
    }
  }
}`}
                                </pre>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">Nested Company Format</h4>
                                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                                    {`{
  "company": {
    "name": "Company Name",
    "price": "100.50",
    "market_cap": "10000000000",
    "PE_ratio": "15.5",
    "financials": {
      "YOY": {
        "sales_growth": "12.5%",
        "EBIDT_growth": "8.3%",
        "net_profit_growth": "15.2%",
        "EPS_growth": "10.1%"
      },
      "quarters": {
        "Q4 2023": {
          "sales": 5000000000,
          "EBIDT": 1000000000,
          "net_profit": 500000000,
          "EPS": "25.50"
        }
      }
    }
  }
}`}
                                </pre>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">Multiple Companies</h4>
                                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                                    {`{
  "companies": [
    {
      "name": "Company A",
      "price": "100.50",
      "market_cap": "10000000000",
      "PE_ratio": "15.5",
      "financials": {
        "YOY": {
          "sales_growth": "12.5%",
          "EBIDT_growth": "8.3%",
          "net_profit_growth": "15.2%",
          "EPS_growth": "10.1%"
        },
        "quarters": {
          "Q4 2023": {
            "sales": 5000000000,
            "EBIDT": 1000000000,
            "net_profit": 500000000,
            "EPS": "25.50"
          }
        }
      }
    }
  ]
}`}
                                </pre>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}