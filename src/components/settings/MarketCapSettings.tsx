"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { MarketCapCategory, MarketCapThresholds } from "@/lib/utils/quarterUtils";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { 
  loadMarketCapThresholds, 
  updateMarketCapThresholds,
  clearError
} from "@/lib/redux/slices/settingsSlice";
import { 
  saveMarketCapThresholdsWithToast, 
  resetMarketCapThresholdsWithToast 
} from "@/lib/redux/actions/toastActions";
import { CheckCircle, AlertCircle, RotateCcw, TrendingUp } from "lucide-react";

export function MarketCapSettings() {
  const dispatch = useAppDispatch();
  const { marketCapThresholds, loading, error } = useAppSelector(state => state.settings);

  // Load settings on component mount
  useEffect(() => {
    dispatch(loadMarketCapThresholds());
  }, [dispatch]);

  const handleSave = async () => {
    try {
      await dispatch(saveMarketCapThresholdsWithToast(marketCapThresholds));
    } catch (error) {
      // Error is handled by the toast action
    }
  };

  const handleReset = async () => {
    try {
      await dispatch(resetMarketCapThresholdsWithToast());
    } catch (error) {
      // Error is handled by the toast action
    }
  };

  const handleThresholdChange = (category: keyof MarketCapThresholds, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedThresholds = {
      ...marketCapThresholds,
      [category]: numValue
    };
    dispatch(updateMarketCapThresholds(updatedThresholds));
    dispatch(clearError());
  };

  const getPreviewCategories = (): MarketCapCategory[] => {
    return [
      { label: 'Micro Cap', color: 'text-purple-700', bgColor: 'bg-purple-100', threshold: marketCapThresholds.microCap },
      { label: 'Small Cap', color: 'text-blue-700', bgColor: 'bg-blue-100', threshold: marketCapThresholds.smallCap },
      { label: 'Mid Cap', color: 'text-orange-700', bgColor: 'bg-orange-100', threshold: marketCapThresholds.midCap },
      { label: 'Large Cap', color: 'text-green-700', bgColor: 'bg-green-100', threshold: marketCapThresholds.largeCap }
    ];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Market Cap Classification
          </CardTitle>
          <CardDescription>
            Configure the threshold values for market cap categories. Values are in crores (₹).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="microCap">Micro Cap Threshold (₹ Cr)</Label>
              <Input
                id="microCap"
                type="number"
                min="0"
                step="100"
                value={marketCapThresholds.microCap}
                onChange={(e) => handleThresholdChange('microCap', e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Companies with market cap from ₹{marketCapThresholds.microCap} Cr
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smallCap">Small Cap Threshold (₹ Cr)</Label>
              <Input
                id="smallCap"
                type="number"
                min="0"
                step="100"
                value={marketCapThresholds.smallCap}
                onChange={(e) => handleThresholdChange('smallCap', e.target.value)}
                placeholder="500"
              />
              <p className="text-xs text-muted-foreground">
                Companies with market cap from ₹{marketCapThresholds.smallCap} Cr
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="midCap">Mid Cap Threshold (₹ Cr)</Label>
              <Input
                id="midCap"
                type="number"
                min="0"
                step="100"
                value={marketCapThresholds.midCap}
                onChange={(e) => handleThresholdChange('midCap', e.target.value)}
                placeholder="5000"
              />
              <p className="text-xs text-muted-foreground">
                Companies with market cap from ₹{marketCapThresholds.midCap} Cr
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="largeCap">Large Cap Threshold (₹ Cr)</Label>
              <Input
                id="largeCap"
                type="number"
                min="0"
                step="100"
                value={marketCapThresholds.largeCap}
                onChange={(e) => handleThresholdChange('largeCap', e.target.value)}
                placeholder="20000"
              />
              <p className="text-xs text-muted-foreground">
                Companies with market cap from ₹{marketCapThresholds.largeCap} Cr and above
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-3">Category Preview</h4>
            <div className="grid gap-2 md:grid-cols-2">
              {getPreviewCategories().map((category, index) => (
                <div key={category.label} className="flex items-center justify-between p-3 border rounded-lg">
                  <Badge
                    variant="outline"
                    className={`${category.color} ${category.bgColor} border-current`}
                  >
                    {category.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {index === getPreviewCategories().length - 1
                      ? `≥ ₹${category.threshold} Cr`
                      : `₹${category.threshold} - ₹${getPreviewCategories()[index + 1]?.threshold - 1} Cr`
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>

            <Button
              variant="outline"
              onClick={handleReset}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}