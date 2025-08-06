"use client";

import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface HistoricalDataPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    adjClose: number;
}

const PERIOD_OPTIONS = [
    { value: '1mo', label: '1 Month' },
    { value: '3mo', label: '3 Months' },
    { value: '6mo', label: '6 Months' },
    { value: '1y', label: '1 Year' },
    { value: '2y', label: '2 Years' },
];

const INTERVAL_OPTIONS = [
    { value: '1d', label: 'Daily' },
    { value: '1wk', label: 'Weekly' },
    { value: '1mo', label: 'Monthly' },
];

interface CandlestickChartProps {
    symbol: string;
    companyName?: string;
    className?: string;
}

export function CandlestickChart({ symbol, companyName, className }: CandlestickChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const seriesRef = useRef<any>(null);

    const [data, setData] = useState<HistoricalDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState('6mo');
    const [interval, setInterval] = useState('1d');

    // Fetch historical data
    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log(`Fetching data for ${symbol}`);
            const response = await fetch(`/api/stocks/historical/${symbol}?period=${period}&interval=${interval}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch data');
            }

            const result = await response.json();
            console.log('Data received:', result.data?.length || 0, 'points');

            setData(result.data || []);
        } catch (err) {
            console.error('Error fetching historical data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load chart data');
        } finally {
            setLoading(false);
        }
    };

    // Initialize chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        console.log('Initializing chart...');

        // Chart options following the example
        const chartOptions = {
            layout: {
                textColor: '#d1d5db',
                background: { type: 'solid', color: 'transparent' },
            },
            grid: {
                vertLines: { color: '#374151' },
                horzLines: { color: '#374151' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
        };

        // Create chart following the example pattern
        const chart = createChart(chartContainerRef.current, chartOptions);

        // Add candlestick series following the example
        const series = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        chartRef.current = chart;
        seriesRef.current = series;

        console.log('Chart initialized successfully');

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

    // Combined effect for chart initialization and data update
    useEffect(() => {
        if (!chartContainerRef.current || !data.length) {
            console.log('Container or data not ready');
            return;
        }

        console.log('Creating chart with', data.length, 'data points');

        // Chart options following the example
        const chartOptions = {
            layout: {
                textColor: '#d1d5db',
                background: { type: 'solid', color: 'transparent' },
            },
            grid: {
                vertLines: { color: '#374151' },
                horzLines: { color: '#374151' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
        };

        // Create chart following the example pattern
        const chart = createChart(chartContainerRef.current, chartOptions);

        // Add candlestick series following the example
        const series = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        try {
            // Convert data to lightweight-charts format
            const candlestickData = data.map(item => ({
                time: item.date,
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
            }));

            console.log('Setting data:', candlestickData.length, 'points');
            console.log('Sample data:', candlestickData[0]);

            // Set data following the example pattern
            series.setData(candlestickData);
            chart.timeScale().fitContent();

            console.log('Chart created and data set successfully');
        } catch (err) {
            console.error('Error setting chart data:', err);
            setError('Failed to display chart data');
        }

        // Store refs
        chartRef.current = chart;
        seriesRef.current = series;

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current && chart) {
                chart.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                });
            }
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
        };
    }, [data]);

    // Fetch data when symbol or parameters change
    useEffect(() => {
        if (symbol) {
            fetchData();
        }
    }, [symbol, period, interval]);

    // Get latest price info
    const getLatestPrice = () => {
        if (!data.length) return null;
        const latest = data[data.length - 1];
        const previous = data[data.length - 2];
        const change = previous ? latest.close - previous.close : 0;
        const changePercent = previous ? (change / previous.close) * 100 : 0;

        return {
            price: latest.close,
            change,
            changePercent,
            isPositive: change >= 0,
        };
    };

    const latestPrice = getLatestPrice();

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>{symbol} - {companyName || 'Stock Chart'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[400px]">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            <span>Loading chart data...</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Chart Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                            <span>{error}</span>
                            <Button variant="outline" size="sm" onClick={fetchData}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                            </Button>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {symbol} - {companyName || 'Stock Chart'}
                            {latestPrice && (
                                <Badge variant={latestPrice.isPositive ? 'default' : 'destructive'}>
                                    ₹{latestPrice.price.toFixed(2)}
                                    ({latestPrice.isPositive ? '+' : ''}{latestPrice.changePercent.toFixed(2)}%)
                                </Badge>
                            )}
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
                <div
                    ref={chartContainerRef}
                    className="w-full h-[400px]"
                />

                {data.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                            <div className="font-medium">Data Points</div>
                            <div>{data.length}</div>
                        </div>
                        <div>
                            <div className="font-medium">Period</div>
                            <div>{PERIOD_OPTIONS.find(p => p.value === period)?.label}</div>
                        </div>
                        <div>
                            <div className="font-medium">Interval</div>
                            <div>{INTERVAL_OPTIONS.find(i => i.value === interval)?.label}</div>
                        </div>
                        <div>
                            <div className="font-medium">Date Range</div>
                            <div>{data[0]?.date} to {data[data.length - 1]?.date}</div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}