'use client';

import React, { useState } from 'react';
import { Portfolio } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Table, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio: Portfolio;
  metrics: {
    netInvested: number;
    currentValue: number;
    totalReturn: number;
    totalReturnPercent: number;
    dayPL: number;
    dayPLPercent: number;
    holdingsCount: number;
    transactionsCount: number;
  };
}

interface ExportOptions {
  format: 'pdf' | 'csv';
  includeHoldings: boolean;
  includeTransactions: boolean;
  includeMetrics: boolean;
  includeCharts: boolean;
}

export function ExportDialog({ 
  open, 
  onOpenChange, 
  portfolio, 
  metrics
}: ExportDialogProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeHoldings: true,
    includeTransactions: true,
    includeMetrics: true,
    includeCharts: false
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (exportOptions.format === 'pdf') {
        await exportToPDF();
      } else {
        await exportToCSV();
      }
      toast.success(`Analytics report exported as ${exportOptions.format.toUpperCase()}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export analytics report');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Portfolio Analytics Report', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Portfolio: ${portfolio.name}`, 20, yPosition);
    yPosition += 5;
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;

    // Portfolio Metrics
    if (exportOptions.includeMetrics) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Portfolio Summary', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const metricsData = [
        ['Total Investment', `₹${metrics.netInvested.toLocaleString()}`],
        ['Current Value', `₹${metrics.currentValue.toLocaleString()}`],
        ['Total Return', `₹${metrics.totalReturn.toLocaleString()} (${metrics.totalReturnPercent.toFixed(2)}%)`],
        ['Day\'s P&L', `₹${metrics.dayPL.toLocaleString()} (${metrics.dayPLPercent.toFixed(2)}%)`],
        ['Holdings Count', metrics.holdingsCount.toString()],
        ['Transactions Count', metrics.transactionsCount.toString()]
      ];

      metricsData.forEach(([label, value]) => {
        pdf.text(`${label}: ${value}`, 20, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Holdings
    if (exportOptions.includeHoldings && portfolio.holdings.length > 0) {
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Holdings', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      // Table headers
      const headers = ['Symbol', 'Qty', 'Avg Price', 'Current Price', 'Value', 'P&L'];
      const colWidths = [30, 20, 25, 25, 30, 30];
      let xPosition = 20;

      pdf.setFont('helvetica', 'bold');
      headers.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += colWidths[index];
      });
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      portfolio.holdings.forEach(holding => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        xPosition = 20;
        const rowData = [
          holding.symbol,
          holding.quantity.toString(),
          `₹${holding.averagePrice.toFixed(2)}`,
          `₹${holding.currentPrice.toFixed(2)}`,
          `₹${holding.totalValue.toLocaleString()}`,
          `₹${holding.unrealizedGain.toLocaleString()}`
        ];

        rowData.forEach((data, index) => {
          pdf.text(data, xPosition, yPosition);
          xPosition += colWidths[index];
        });
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Transactions
    if (exportOptions.includeTransactions && portfolio.transactions.length > 0) {
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Recent Transactions', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      // Show last 10 transactions
      const recentTransactions = [...portfolio.transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      recentTransactions.forEach(tx => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.text(
          `${new Date(tx.date).toLocaleDateString()} - ${tx.type.toUpperCase()} ${tx.quantity} ${tx.symbol} @ ₹${tx.price}`,
          20,
          yPosition
        );
        yPosition += 6;
      });
    }

    pdf.save(`${portfolio.name}_analytics_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = async () => {
    let csvContent = '';

    // Portfolio Summary
    if (exportOptions.includeMetrics) {
      csvContent += 'Portfolio Analytics Summary\n';
      csvContent += `Portfolio Name,${portfolio.name}\n`;
      csvContent += `Generated Date,${new Date().toLocaleDateString()}\n`;
      csvContent += `Total Investment,${metrics.netInvested}\n`;
      csvContent += `Current Value,${metrics.currentValue}\n`;
      csvContent += `Total Return,${metrics.totalReturn}\n`;
      csvContent += `Total Return %,${metrics.totalReturnPercent.toFixed(2)}\n`;
      csvContent += `Day P&L,${metrics.dayPL}\n`;
      csvContent += `Day P&L %,${metrics.dayPLPercent.toFixed(2)}\n`;
      csvContent += `Holdings Count,${metrics.holdingsCount}\n`;
      csvContent += `Transactions Count,${metrics.transactionsCount}\n\n`;
    }

    // Holdings
    if (exportOptions.includeHoldings && portfolio.holdings.length > 0) {
      csvContent += 'Holdings\n';
      csvContent += 'Symbol,Quantity,Average Price,Current Price,Total Value,Unrealized Gain,Sector,Industry\n';
      
      portfolio.holdings.forEach(holding => {
        csvContent += `${holding.symbol},${holding.quantity},${holding.averagePrice},${holding.currentPrice},${holding.totalValue},${holding.unrealizedGain},"${holding.sector || ''}","${holding.industry || ''}"\n`;
      });
      csvContent += '\n';
    }

    // Transactions
    if (exportOptions.includeTransactions && portfolio.transactions.length > 0) {
      csvContent += 'Transactions\n';
      csvContent += 'Date,Type,Symbol,Quantity,Price,Total Amount,Fees\n';
      
      const sortedTransactions = [...portfolio.transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      sortedTransactions.forEach(tx => {
        csvContent += `${new Date(tx.date).toLocaleDateString()},${tx.type.toUpperCase()},${tx.symbol},${tx.quantity},${tx.price},${tx.totalAmount},${tx.fees || 0}\n`;
      });
    }

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${portfolio.name}_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Analytics Report</DialogTitle>
          <DialogDescription>
            Choose the format and data to include in your analytics report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Export Format</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={exportOptions.format}
                onValueChange={(value: 'pdf' | 'csv') => 
                  setExportOptions(prev => ({ ...prev, format: value }))
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF Report
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    CSV Data
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Data Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Include Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metrics"
                  checked={exportOptions.includeMetrics}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeMetrics: !!checked }))
                  }
                />
                <Label htmlFor="metrics">Portfolio Metrics</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="holdings"
                  checked={exportOptions.includeHoldings}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeHoldings: !!checked }))
                  }
                />
                <Label htmlFor="holdings">Holdings Details</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="transactions"
                  checked={exportOptions.includeTransactions}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeTransactions: !!checked }))
                  }
                />
                <Label htmlFor="transactions">Transaction History</Label>
              </div>

              {exportOptions.format === 'pdf' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="charts"
                    checked={exportOptions.includeCharts}
                    onCheckedChange={(checked) =>
                      setExportOptions(prev => ({ ...prev, includeCharts: !!checked }))
                    }
                  />
                  <Label htmlFor="charts">Charts (PDF only)</Label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {exportOptions.format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}