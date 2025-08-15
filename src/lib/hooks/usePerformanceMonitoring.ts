/**
 * Performance Monitoring Hook
 * Monitors component performance and provides optimization insights
 */

import { useEffect, useRef, useCallback } from 'react';
import { MemoryMonitor } from '@/lib/utils/performanceOptimization';

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentName: string;
  timestamp: number;
  props?: any;
}

export interface PerformanceThresholds {
  renderTime: number;
  memoryUsage: number;
  warningCallback?: (metrics: PerformanceMetrics) => void;
}

/**
 * Hook for monitoring component performance
 * Usage: Call startMeasurement() at component start and endMeasurement() at component end
 */
export function usePerformanceMonitoring(
  componentName: string,
  thresholds: PerformanceThresholds = { renderTime: 100, memoryUsage: 50 },
  props?: any
) {
  const renderStartTime = useRef<number | undefined>(undefined);
  const memoryMonitor = MemoryMonitor.getInstance();
  const metricsHistory = useRef<PerformanceMetrics[]>([]);

  // Start performance measurement
  const startMeasurement = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  // End performance measurement
  const endMeasurement = useCallback(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      const memoryUsage = memoryMonitor.measure();
      
      const metrics: PerformanceMetrics = {
        renderTime,
        memoryUsage,
        componentName,
        timestamp: Date.now(),
        props: props ? JSON.stringify(props).length : 0
      };

      // Store metrics
      metricsHistory.current.push(metrics);
      
      // Keep only last 10 measurements
      if (metricsHistory.current.length > 10) {
        metricsHistory.current.shift();
      }

      // Check thresholds
      if (renderTime > thresholds.renderTime || memoryUsage > thresholds.memoryUsage) {
        console.warn(`Performance warning for ${componentName}:`, {
          renderTime: `${renderTime.toFixed(2)}ms (threshold: ${thresholds.renderTime}ms)`,
          memoryUsage: `${memoryUsage.toFixed(2)}MB (threshold: ${thresholds.memoryUsage}MB)`,
          propsSize: metrics.props
        });

        if (thresholds.warningCallback) {
          thresholds.warningCallback(metrics);
        }
      }

      renderStartTime.current = undefined;
      return metrics;
    }
    return null;
  }, [componentName, thresholds, props, memoryMonitor]);

  // Get performance statistics
  const getStats = useCallback(() => {
    const metrics = metricsHistory.current;
    if (metrics.length === 0) return null;

    const renderTimes = metrics.map(m => m.renderTime);
    const memoryUsages = metrics.map(m => m.memoryUsage);

    return {
      averageRenderTime: renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length,
      maxRenderTime: Math.max(...renderTimes),
      minRenderTime: Math.min(...renderTimes),
      averageMemoryUsage: memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length,
      maxMemoryUsage: Math.max(...memoryUsages),
      measurementCount: metrics.length,
      isPerformant: renderTimes.every(time => time < thresholds.renderTime) && 
                   memoryUsages.every(usage => usage < thresholds.memoryUsage)
    };
  }, [thresholds]);

  // Note: Auto-measurement removed to prevent infinite loops
  // Components should manually call startMeasurement() and endMeasurement()

  return {
    startMeasurement,
    endMeasurement,
    getStats,
    metricsHistory: metricsHistory.current
  };
}

/**
 * Simple performance monitoring hook that measures render time automatically
 */
export function useSimplePerformanceMonitoring(componentName: string, enabled: boolean = true) {
  const renderTime = useRef<number>(0);
  
  useEffect(() => {
    if (!enabled) return;
    
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      renderTime.current = duration;
      
      if (duration > 100) { // 100ms threshold
        console.warn(`Slow render for ${componentName}: ${duration.toFixed(2)}ms`);
      }
    };
  }, [componentName, enabled]);
  
  return { renderTime: renderTime.current };
}

/**
 * Hook for monitoring portfolio-specific performance
 */
export function usePortfolioPerformanceMonitoring(
  componentName: string,
  holdingsCount: number,
  props?: any
) {
  // Adjust thresholds based on holdings count
  const thresholds: PerformanceThresholds = {
    renderTime: holdingsCount > 100 ? 200 : holdingsCount > 50 ? 150 : 100,
    memoryUsage: holdingsCount > 100 ? 100 : holdingsCount > 50 ? 75 : 50,
    warningCallback: (metrics) => {
      // Custom warning for portfolio components
      console.warn(`Portfolio component ${componentName} performance issue:`, {
        holdingsCount,
        renderTime: `${metrics.renderTime.toFixed(2)}ms`,
        memoryUsage: `${metrics.memoryUsage.toFixed(2)}MB`,
        recommendation: holdingsCount > 100 ? 
          'Consider implementing virtualization for large portfolios' :
          'Consider memoization or component optimization'
      });
    }
  };

  return usePerformanceMonitoring(componentName, thresholds, props);
}

/**
 * Hook for monitoring data processing performance
 */
export function useDataProcessingPerformance(
  operationName: string,
  dataSize: number
) {
  const startTime = useRef<number | undefined>(undefined);
  const processingHistory = useRef<Array<{ duration: number; dataSize: number; timestamp: number }>>([]);

  const startProcessing = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const endProcessing = useCallback(() => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current;
      
      processingHistory.current.push({
        duration,
        dataSize,
        timestamp: Date.now()
      });

      // Keep only last 20 measurements
      if (processingHistory.current.length > 20) {
        processingHistory.current.shift();
      }

      // Performance warnings based on data size
      const expectedTime = dataSize * 0.1; // 0.1ms per item baseline
      if (duration > expectedTime * 2) {
        console.warn(`Slow data processing for ${operationName}:`, {
          duration: `${duration.toFixed(2)}ms`,
          dataSize,
          expectedTime: `${expectedTime.toFixed(2)}ms`,
          efficiency: `${(expectedTime / duration * 100).toFixed(1)}%`
        });
      }

      startTime.current = undefined;
      return { duration, dataSize, efficiency: expectedTime / duration };
    }
    return null;
  }, [operationName, dataSize]);

  const getProcessingStats = useCallback(() => {
    const history = processingHistory.current;
    if (history.length === 0) return null;

    const durations = history.map(h => h.duration);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const avgDataSize = history.reduce((sum, h) => sum + h.dataSize, 0) / history.length;

    return {
      averageDuration: avgDuration,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      averageDataSize: avgDataSize,
      throughput: avgDataSize / (avgDuration / 1000), // items per second
      measurementCount: history.length
    };
  }, []);

  return {
    startProcessing,
    endProcessing,
    getProcessingStats,
    processingHistory: processingHistory.current
  };
}

/**
 * Hook for monitoring API call performance
 */
export function useAPIPerformanceMonitoring(apiName: string) {
  const callHistory = useRef<Array<{
    duration: number;
    success: boolean;
    timestamp: number;
    cacheHit?: boolean;
  }>>([]);

  const trackAPICall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    options: { cacheHit?: boolean } = {}
  ): Promise<T> => {
    const startTime = performance.now();
    let success = false;
    
    try {
      const result = await apiCall();
      success = true;
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      
      callHistory.current.push({
        duration,
        success,
        timestamp: Date.now(),
        cacheHit: options.cacheHit
      });

      // Keep only last 50 API calls
      if (callHistory.current.length > 50) {
        callHistory.current.shift();
      }

      // Log slow API calls
      if (duration > 5000) { // 5 seconds
        console.warn(`Slow API call for ${apiName}:`, {
          duration: `${duration.toFixed(2)}ms`,
          success,
          cacheHit: options.cacheHit
        });
      }
    }
  }, [apiName]);

  const getAPIStats = useCallback(() => {
    const history = callHistory.current;
    if (history.length === 0) return null;

    const durations = history.map(h => h.duration);
    const successfulCalls = history.filter(h => h.success);
    const cacheHits = history.filter(h => h.cacheHit);

    return {
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      successRate: (successfulCalls.length / history.length) * 100,
      cacheHitRate: (cacheHits.length / history.length) * 100,
      totalCalls: history.length,
      recentCalls: history.slice(-10)
    };
  }, []);

  return {
    trackAPICall,
    getAPIStats,
    callHistory: callHistory.current
  };
}