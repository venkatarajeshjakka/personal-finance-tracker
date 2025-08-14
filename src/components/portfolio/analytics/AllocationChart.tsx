'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

interface AllocationData {
  sector?: string;
  industry?: string;
  category?: string;
  name?: string;
  value: number;
  count?: number;
  percentage: number;
}

interface AllocationChartProps {
  data: AllocationData[];
  type: 'sector' | 'industry' | 'marketCap' | 'holdings';
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#ec4899', // pink
  '#6b7280', // gray
];

export function AllocationChart({ data, type }: AllocationChartProps) {
  // Prepare data for charts
  const chartData = data.slice(0, 10).map((item, index) => {
    let name = '';
    switch (type) {
      case 'sector':
        name = item.sector || '';
        break;
      case 'industry':
        name = item.industry || '';
        break;
      case 'marketCap':
        name = item.category || '';
        break;
      case 'holdings':
        name = item.name || '';
        break;
    }
    
    return {
      name,
      value: item.value,
      percentage: item.percentage,
      count: item.count,
      color: COLORS[index % COLORS.length]
    };
  });

  // Calculate "Others" category if there are more than 10 items
  if (data.length > 10) {
    const othersValue = data.slice(10).reduce((sum, item) => sum + item.value, 0);
    const othersPercentage = data.slice(10).reduce((sum, item) => sum + item.percentage, 0);
    const othersCount = data.slice(10).reduce((sum, item) => sum + (item.count || 1), 0);
    
    chartData.push({
      name: 'Others',
      value: othersValue,
      percentage: othersPercentage,
      count: othersCount,
      color: '#9ca3af'
    });
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card className="p-3 shadow-lg">
          <CardContent className="p-0 space-y-1">
            <p className="font-medium">{data.name}</p>
            <p className="text-sm">
              Value: ₹{data.value.toLocaleString()}
            </p>
            <p className="text-sm">
              Percentage: {data.percentage.toFixed(1)}%
            </p>
            {data.count && (
              <p className="text-sm">
                {type === 'holdings' ? 'Holdings' : 'Stocks'}: {data.count}
              </p>
            )}
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (percentage < 5) return null; // Don't show labels for small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${percentage.toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pie Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with detailed information */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">
          {type === 'sector' && 'Sector Breakdown'}
          {type === 'industry' && 'Industry Breakdown'}
          {type === 'marketCap' && 'Market Cap Breakdown'}
          {type === 'holdings' && 'Holdings Breakdown'}
        </h4>
        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium truncate max-w-32">
                  {item.name}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  ₹{(item.value / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.percentage.toFixed(1)}%
                  {item.count && ` • ${item.count} ${type === 'holdings' ? 'units' : 'stocks'}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bar Chart for better comparison */}
      <div className="h-64">
        <h4 className="text-sm font-medium mb-2">Value Comparison</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              type="number" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              width={80}
            />
            <Tooltip 
              formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Value']}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}