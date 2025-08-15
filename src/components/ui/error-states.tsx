/**
 * Standardized Error State Components
 * Provides consistent error handling and display across the application
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, Database, TrendingDown, FileX, AlertCircle, Bug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'warning';
  showIcon?: boolean;
}

/**
 * Generic error state component
 */
export function ErrorState({ 
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  className = '',
  variant = 'destructive',
  showIcon = true,
  children
}: ErrorStateProps & { children?: React.ReactNode }) {
  return (
    <Card className={`border-destructive/20 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
          {children || (showIcon && <AlertTriangle className="h-12 w-12 text-destructive" />)}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-destructive">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-md">{message}</p>
          </div>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              {retryLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Network error state
 */
export function NetworkErrorState({ 
  onRetry,
  className = ''
}: { onRetry?: () => void; className?: string }) {
  return (
    <ErrorState
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      retryLabel="Reconnect"
      className={className}
      showIcon={false}
    >
      <Wifi className="h-12 w-12 text-destructive" />
    </ErrorState>
  );
}

/**
 * Data loading error state
 */
export function DataErrorState({ 
  onRetry,
  dataType = 'data',
  className = ''
}: { onRetry?: () => void; dataType?: string; className?: string }) {
  return (
    <ErrorState
      title={`Failed to Load ${dataType}`}
      message={`We couldn't load your ${dataType}. This might be a temporary issue.`}
      onRetry={onRetry}
      retryLabel="Reload Data"
      className={className}
      showIcon={false}
    >
      <Database className="h-12 w-12 text-destructive" />
    </ErrorState>
  );
}

/**
 * Portfolio-specific error state
 */
export function PortfolioErrorState({ 
  onRetry,
  className = ''
}: { onRetry?: () => void; className?: string }) {
  return (
    <ErrorState
      title="Portfolio Error"
      message="Unable to load portfolio data. Your investments data might be temporarily unavailable."
      onRetry={onRetry}
      retryLabel="Reload Portfolio"
      className={className}
      showIcon={false}
    >
      <TrendingDown className="h-12 w-12 text-destructive" />
    </ErrorState>
  );
}

/**
 * Empty state (not technically an error, but related)
 */
export function EmptyState({ 
  title = 'No Data Available',
  message = 'There is no data to display at the moment.',
  actionLabel,
  onAction,
  icon: Icon = FileX,
  className = ''
}: {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
          <Icon className="h-12 w-12 text-muted-foreground/50" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-muted-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-md">{message}</p>
          </div>
          {onAction && actionLabel && (
            <Button onClick={onAction} variant="outline" size="sm">
              {actionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Inline error alert
 */
export function InlineErrorAlert({ 
  title = 'Error',
  message,
  onDismiss,
  className = ''
}: {
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Warning alert
 */
export function WarningAlert({ 
  title = 'Warning',
  message,
  onDismiss,
  className = ''
}: {
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <Alert variant="default" className={`border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-200">{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between text-yellow-700 dark:text-yellow-300">
        <span>{message}</span>
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * API error state with detailed information
 */
export function APIErrorState({ 
  error,
  onRetry,
  className = ''
}: {
  error: { status?: number; message?: string; code?: string };
  onRetry?: () => void;
  className?: string;
}) {
  const getErrorMessage = () => {
    if (error.status === 404) return 'The requested data was not found.';
    if (error.status === 403) return 'You do not have permission to access this data.';
    if (error.status === 500) return 'Server error. Please try again later.';
    if (error.status === 429) return 'Too many requests. Please wait a moment and try again.';
    return error.message || 'An unexpected error occurred.';
  };

  const getErrorTitle = () => {
    if (error.status === 404) return 'Data Not Found';
    if (error.status === 403) return 'Access Denied';
    if (error.status === 500) return 'Server Error';
    if (error.status === 429) return 'Rate Limited';
    return 'API Error';
  };

  return (
    <Card className={`border-destructive/20 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Bug className="h-5 w-5" />
          {getErrorTitle()}
          {error.status && <span className="text-sm font-mono">({error.status})</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{getErrorMessage()}</p>
          {error.code && (
            <p className="text-xs font-mono text-muted-foreground">Error Code: {error.code}</p>
          )}
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Validation error state for forms
 */
export function ValidationErrorState({ 
  errors,
  className = ''
}: {
  errors: string[];
  className?: string;
}) {
  if (errors.length === 0) return null;

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Validation Error</AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1 mt-2">
          {errors.map((error, index) => (
            <li key={index} className="text-sm">{error}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Error boundary fallback component
 */
export function ErrorBoundaryFallback({ 
  error,
  resetError,
  className = ''
}: {
  error: Error;
  resetError: () => void;
  className?: string;
}) {
  return (
    <Card className={`border-destructive/20 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Bug className="h-5 w-5" />
          Application Error
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Something went wrong in this part of the application. This error has been logged.
          </p>
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Technical Details
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
          <div className="flex gap-2">
            <Button onClick={resetError} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm"
            >
              Reload Page
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Timeout error state
 */
export function TimeoutErrorState({ 
  onRetry,
  className = ''
}: { onRetry?: () => void; className?: string }) {
  return (
    <ErrorState
      title="Request Timeout"
      message="The request is taking longer than expected. Please check your connection and try again."
      onRetry={onRetry}
      retryLabel="Try Again"
      className={className}
    />
  );
}

/**
 * Permission error state
 */
export function PermissionErrorState({ 
  resource = 'this resource',
  className = ''
}: { resource?: string; className?: string }) {
  return (
    <ErrorState
      title="Access Denied"
      message={`You don't have permission to access ${resource}. Please contact your administrator if you believe this is an error.`}
      className={className}
      showIcon={false}
    >
      <AlertTriangle className="h-12 w-12 text-yellow-500" />
    </ErrorState>
  );
}