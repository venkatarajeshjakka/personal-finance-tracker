/**
 * Standardized Loading State Components
 * Provides consistent loading indicators across the application
 */

import React from 'react';
import { Loader2, TrendingUp, PieChart, BarChart3, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface LoadingStateProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

/**
 * Basic spinner loading component
 */
export function LoadingSpinner({ size = 'md', message, className = '' }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  );
}

/**
 * Card-based loading state
 */
export function LoadingCard({ message = 'Loading...', className = '' }: LoadingStateProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Portfolio-specific loading state
 */
export function PortfolioLoadingState({ message = 'Loading portfolio data...', className = '' }: LoadingStateProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="relative">
            <PieChart className="h-12 w-12 text-muted-foreground/30" />
            <Loader2 className="h-6 w-6 animate-spin text-primary absolute top-3 left-3" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">{message}</p>
            <p className="text-xs text-muted-foreground">Calculating metrics and allocations...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Chart loading state
 */
export function ChartLoadingState({ message = 'Loading chart data...', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 space-y-4 ${className}`}>
      <div className="relative">
        <BarChart3 className="h-12 w-12 text-muted-foreground/30" />
        <Loader2 className="h-6 w-6 animate-spin text-primary absolute top-3 left-3" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium">{message}</p>
        <p className="text-xs text-muted-foreground">Fetching historical data...</p>
      </div>
    </div>
  );
}

/**
 * Table loading state with skeleton rows
 */
export function TableLoadingState({ rows = 5, columns = 4, className = '' }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Holdings table loading state
 */
export function HoldingsTableLoadingState({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header skeleton */}
      <div className="grid grid-cols-9 gap-4 p-4 border-b">
        {Array.from({ length: 9 }).map((_, index) => (
          <Skeleton key={index} className="h-4" />
        ))}
      </div>

      {/* Row skeletons */}
      {Array.from({ length: 8 }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-9 gap-4 p-4 border-b">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1" />
          </div>
          {Array.from({ length: 8 }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Dashboard loading state
 */
export function DashboardLoadingState({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <ChartLoadingState />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Inline loading state for buttons and small components
 */
export function InlineLoadingState({ message, className = '' }: { message?: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {message && <span className="text-sm">{message}</span>}
    </div>
  );
}

/**
 * Full page loading state
 */
export function FullPageLoadingState({ message = 'Loading application...', className = '' }: LoadingStateProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <div className="text-center space-y-6">
        <div className="relative">
          <DollarSign className="h-16 w-16 text-muted-foreground/30 mx-auto" />
          <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-4 left-1/2 transform -translate-x-1/2" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{message}</h2>
          <p className="text-sm text-muted-foreground">Please wait while we prepare your data...</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Data fetching loading state with progress
 */
export function DataFetchingLoadingState({
  message = 'Fetching data...',
  progress,
  className = ''
}: LoadingStateProps & { progress?: number }) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 space-y-4 ${className}`}>
      <div className="relative">
        <TrendingUp className="h-12 w-12 text-muted-foreground/30" />
        <Loader2 className="h-6 w-6 animate-spin text-primary absolute top-3 left-3" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-sm font-medium">{message}</p>
        {progress !== undefined && (
          <div className="w-48 bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {progress !== undefined ? `${Math.round(progress)}% complete` : 'Processing...'}
        </p>
      </div>
    </div>
  );
}

/**
 * Lazy loading placeholder
 */
export function LazyLoadingPlaceholder({ height = 200, className = '' }: { height?: number; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-muted/20 rounded-lg ${className}`}
      style={{ height: `${height}px` }}
    >
      <div className="text-center space-y-2">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
        <p className="text-xs text-muted-foreground">Loading component...</p>
      </div>
    </div>
  );
}