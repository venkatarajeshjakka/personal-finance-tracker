'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/lib/redux/store';
import {
    loadPriceUpdateSettings,
    savePriceUpdateSettings,
    resetPriceUpdateSettings,
    updatePriceUpdateSettings
} from '@/lib/redux/slices/settingsSlice';
import { getMarketStatus } from '@/lib/utils/marketHours';
import { Clock, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

const PriceUpdateSettings: React.FC = () => {
    const dispatch = useAppDispatch();
    const { priceUpdateSettings, loading, error } = useAppSelector(state => state.settings);
    const marketStatus = getMarketStatus();

    useEffect(() => {
        dispatch(loadPriceUpdateSettings());
    }, [dispatch]);

    const refreshIntervalOptions = [
        { value: 300000, label: '5 minutes' },
        { value: 600000, label: '10 minutes' },
        { value: 1800000, label: '30 minutes' },
        { value: 3600000, label: '1 hour' },
        { value: 7200000, label: '2 hours' },
        { value: 14400000, label: '4 hours' }
    ];

    const getMarketStatusDisplay = () => {
        const statusConfig = {
            OPEN: { color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp, text: 'Market Open' },
            CLOSED: { color: 'text-gray-600', bg: 'bg-gray-50', icon: Clock, text: 'Market Closed' },
            PRE_MARKET: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock, text: 'Pre-Market' },
            POST_MARKET: { color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock, text: 'Post-Market' },
            HOLIDAY: { color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle, text: 'Market Holiday' }
        };

        const config = statusConfig[marketStatus.marketState];
        const Icon = config.icon;

        return (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg}`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
                <span className={`text-sm font-medium ${config.color}`}>
                    {config.text}
                </span>
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    Price Update Settings
                </CardTitle>
                <CardDescription>
                    Configure how and when stock prices are updated automatically
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Market Status */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Current Market Status</Label>
                    {getMarketStatusDisplay()}
                    {marketStatus.nextOpenTime && !marketStatus.isOpen && (
                        <p className="text-xs text-gray-500">
                            Next market open: {marketStatus.nextOpenTime.toLocaleString()}
                        </p>
                    )}
                </div>

                {/* Auto Refresh Toggle */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label htmlFor="auto-refresh">Auto Refresh Prices</Label>
                        <p className="text-sm text-gray-500">
                            Automatically update stock prices at regular intervals
                        </p>
                    </div>
                    <Switch
                        id="auto-refresh"
                        checked={priceUpdateSettings.autoRefreshEnabled}
                        onCheckedChange={(checked) => {
                            const newSettings = { ...priceUpdateSettings, autoRefreshEnabled: checked };
                            dispatch(updatePriceUpdateSettings({ autoRefreshEnabled: checked }));
                            dispatch(savePriceUpdateSettings(newSettings));
                        }}
                    />
                </div>

                {/* Refresh Interval */}
                <div className="space-y-2">
                    <Label htmlFor="refresh-interval">Refresh Interval</Label>
                    <Select
                        value={priceUpdateSettings.refreshInterval.toString()}
                        onValueChange={(value) => {
                            const refreshInterval = parseInt(value);
                            const newSettings = { ...priceUpdateSettings, refreshInterval };
                            dispatch(updatePriceUpdateSettings({ refreshInterval }));
                            dispatch(savePriceUpdateSettings(newSettings));
                        }}
                        disabled={!priceUpdateSettings.autoRefreshEnabled}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {refreshIntervalOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                        How often to check for price updates when auto-refresh is enabled
                    </p>
                </div>

                {/* Market Hours Only */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label htmlFor="market-hours-only">Update During Market Hours Only</Label>
                        <p className="text-sm text-gray-500">
                            Only update prices when the market is open (9:15 AM - 3:30 PM IST)
                        </p>
                    </div>
                    <Switch
                        id="market-hours-only"
                        checked={priceUpdateSettings.marketHoursOnly}
                        onCheckedChange={(checked) => {
                            const newSettings = { ...priceUpdateSettings, marketHoursOnly: checked };
                            dispatch(updatePriceUpdateSettings({ marketHoursOnly: checked }));
                            dispatch(savePriceUpdateSettings(newSettings));
                        }}
                    />
                </div>

                {/* Check Market Holidays */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label htmlFor="check-holidays">Skip Updates on Market Holidays</Label>
                        <p className="text-sm text-gray-500">
                            Don't update prices on NSE holidays and weekends
                        </p>
                    </div>
                    <Switch
                        id="check-holidays"
                        checked={priceUpdateSettings.checkMarketHolidays}
                        onCheckedChange={(checked) => {
                            const newSettings = { ...priceUpdateSettings, checkMarketHolidays: checked };
                            dispatch(updatePriceUpdateSettings({ checkMarketHolidays: checked }));
                            dispatch(savePriceUpdateSettings(newSettings));
                        }}
                    />
                </div>

                {/* Current Settings Summary */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <h4 className="font-medium text-sm">Current Configuration</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Auto Refresh:</span>
                            <span className={`ml-2 ${priceUpdateSettings.autoRefreshEnabled ? 'text-green-600' : 'text-red-600'}`}>
                                {priceUpdateSettings.autoRefreshEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">Interval:</span>
                            <span className="ml-2">
                                {refreshIntervalOptions.find(opt => opt.value === priceUpdateSettings.refreshInterval)?.label || 'Custom'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">Market Hours Only:</span>
                            <span className={`ml-2 ${priceUpdateSettings.marketHoursOnly ? 'text-green-600' : 'text-orange-600'}`}>
                                {priceUpdateSettings.marketHoursOnly ? 'Yes' : 'No'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">Skip Holidays:</span>
                            <span className={`ml-2 ${priceUpdateSettings.checkMarketHolidays ? 'text-green-600' : 'text-orange-600'}`}>
                                {priceUpdateSettings.checkMarketHolidays ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Error</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                )}

                {/* Reset Button */}
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        onClick={() => dispatch(resetPriceUpdateSettings())}
                        disabled={loading}
                        className="text-sm"
                    >
                        {loading ? 'Resetting...' : 'Reset to Defaults'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default PriceUpdateSettings;