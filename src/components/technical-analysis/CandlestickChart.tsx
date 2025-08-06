"use client";

import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, ColorType } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface HistoricalDataPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
}

const PERIOD_OPTIONS = [
    { value: '1mo', label: '1 Month' },
    { value: '3mo', label: '3 Months' },
    { value: '6mo', label: '6 Months' },
    { value: '1y', label: '1 Year' },
    { value: '2y', label: '2 Years' },
    { value: '3y', label: '3 Years' },
    { value: '5y', label: '5 Years' }
];

const INTERVAL_OPTIONS = [
    { value: '1d', label: 'Daily' },
    { value: '1wk', label: 'Weekly' },
    { value: '1mo', label: 'Monthly' },
];

interface CandlestickChartProps {
    symbol: string;
    className?: string;
}

export function CandlestickChart({ symbol, className }: CandlestickChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const seriesRef = useRef<any>(null);

    const [data, setData] = useState<HistoricalDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState('1y');
    const [interval, setInterval] = useState('1wk');

    // Fetch historical data
    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/stocks/historical/${symbol}?period=${period}&interval=${interval}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch data');
            }

            const result = await response.json();
            setData(result.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load chart data');
        } finally {
            setLoading(false);
        }
    };

    // Initialize chart once
    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Chart options
        const chartOptions = {
            layout: {
                textColor: '#d1d5db',
                background: { type: ColorType.Solid, color: 'transparent' },
            },
            grid: {
                vertLines: { color: '#374151' },
                horzLines: { color: '#374151' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
            },
            handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinch: true,
            },
        };

        // Create chart
        const chart = createChart(chartContainerRef.current, chartOptions);

        // Add candlestick series
        const series = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        chartRef.current = chart;
        seriesRef.current = series;

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
                seriesRef.current = null;
            }
        };
    }, []);

    // Update chart data when data changes
    useEffect(() => {
        if (!chartRef.current || !seriesRef.current) {
            return;
        }

        // Clear any previous error when new data arrives
        if (data.length > 0) {
            setError(null);
        }

        try {
            if (data.length === 0) {
                // Clear the chart if no data
                seriesRef.current.setData([]);
                return;
            }

            // Convert data to lightweight-charts format with proper date handling
            const candlestickData = data
                .map(item => {
                    // Parse the date string and convert to YYYY-MM-DD format
                    let timeValue: string;

                    try {
                        // Handle different date formats
                        const date = new Date(item.date);
                        if (isNaN(date.getTime())) {
                            return null;
                        }

                        // Convert to YYYY-MM-DD format required by lightweight-charts
                        timeValue = date.toISOString().split('T')[0];
                    } catch (dateError) {
                        return null;
                    }

                    return {
                        time: timeValue,
                        open: Number(item.open),
                        high: Number(item.high),
                        low: Number(item.low),
                        close: Number(item.close),
                    };
                })
                .filter(item => item !== null) // Remove invalid entries
                .sort((a, b) => a!.time.localeCompare(b!.time)); // Sort by date

            if (candlestickData.length === 0) {
                seriesRef.current.setData([]);
                return;
            }

            // Update data without recreating the chart
            seriesRef.current.setData(candlestickData);
            chartRef.current.timeScale().fitContent();
        } catch (err) {
            setError('Failed to display chart data');
        }
    }, [data]);

    // Fetch data when symbol or parameters change
    useEffect(() => {
        if (symbol) {
            fetchData();
        }
    }, [symbol, period, interval]);

    // Show loading overlay instead of replacing entire component
    const showLoadingOverlay = loading && data.length === 0;
    const showErrorOverlay = error && data.length === 0;

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {symbol}
                        </CardTitle>
                    </div>

                    <div className="flex items-center gap-2">
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PERIOD_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={interval} onValueChange={setInterval}>
                            <SelectTrigger className="w-24">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {INTERVAL_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button variant="outline" size="sm" onClick={fetchData}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="relative w-full h-[400px]">
                    <div
                        ref={chartContainerRef}
                        className="w-full h-full"
                    />

                    {/* Loading Overlay */}
                    {showLoadingOverlay && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <RefreshCw className="h-5 w-5 animate-spin" />
                                <span>Loading chart data...</span>
                            </div>
                        </div>
                    )}

                    {/* Error Overlay */}
                    {showErrorOverlay && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
                            <Alert variant="destructive" className="max-w-md">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="flex items-center justify-between">
                                    <span>{error}</span>
                                    <Button variant="outline" size="sm" onClick={fetchData} className="ml-2">
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Retry
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}