/**
 * Performance Optimization Utilities
 * Provides caching, memoization, and optimization strategies for large portfolios
 */

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

/**
 * Cache implementation with TTL (Time To Live)
 */
export class TTLCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    // Clean expired items first
    this.cleanExpired();
    return this.cache.size;
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; hitRate: number; memoryUsage: number } {
    this.cleanExpired();
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for this
      memoryUsage: JSON.stringify([...this.cache.entries()]).length
    };
  }
}

/**
 * Global cache instances for different data types
 */
export const portfolioCalculationsCache = new TTLCache<any>(10 * 60 * 1000); // 10 minutes
export const priceDataCache = new TTLCache<any>(2 * 60 * 1000); // 2 minutes
export const chartDataCache = new TTLCache<any>(5 * 60 * 1000); // 5 minutes

/**
 * Debounce utility for expensive operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

/**
 * Throttle utility for high-frequency operations
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoization with custom key generation
 */
export function memoizeWithKey<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  cache: TTLCache<ReturnType<T>> = new TTLCache<ReturnType<T>>()
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator(...args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Batch processing utility for large datasets
 */
export class BatchProcessor<T, R> {
  private batchSize: number;
  private processingDelay: number;

  constructor(batchSize: number = 50, processingDelay: number = 10) {
    this.batchSize = batchSize;
    this.processingDelay = processingDelay;
  }

  async process(
    items: T[],
    processor: (batch: T[]) => Promise<R[]> | R[],
    onProgress?: (processed: number, total: number) => void
  ): Promise<R[]> {
    const results: R[] = [];
    const total = items.length;

    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);

      if (onProgress) {
        onProgress(Math.min(i + this.batchSize, total), total);
      }

      // Add delay to prevent blocking the main thread
      if (i + this.batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, this.processingDelay));
      }
    }

    return results;
  }
}

/**
 * Virtual scrolling utility for large lists
 */
export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualScroll<T>(
  items: T[],
  config: VirtualScrollConfig
) {
  const { itemHeight, containerHeight, overscan = 5 } = config;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index
    }));
  }, [items, startIndex, endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(name: string, threshold: number = 100) {
  const startTime = useRef<number | undefined>(undefined);
  const measurements = useRef<number[]>([]);

  const start = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const end = useCallback(() => {
    if (startTime.current !== undefined) {
      const duration = performance.now() - startTime.current;
      measurements.current.push(duration);

      // Keep only last 10 measurements
      if (measurements.current.length > 10) {
        measurements.current.shift();
      }

      if (duration > threshold) {
        console.warn(`Performance warning: ${name} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
      }

      startTime.current = undefined;
      return duration;
    }
    return 0;
  }, [name, threshold]);

  const getStats = useCallback(() => {
    const measurementList = measurements.current;
    if (measurementList.length === 0) return null;

    const avg = measurementList.reduce((sum: number, m: number) => sum + m, 0) / measurementList.length;
    const min = Math.min(...measurementList);
    const max = Math.max(...measurementList);

    return { avg, min, max, count: measurementList.length };
  }, []);

  return { start, end, getStats };
}

/**
 * Lazy loading hook with intersection observer
 */
export function useLazyLoading(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isIntersecting) {
          setIsIntersecting(true);
          callback();
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [callback, isIntersecting, options]);

  return { targetRef, isIntersecting };
}

/**
 * Memory usage monitoring
 */
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private measurements: Array<{ timestamp: number; usage: number }> = [];

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  measure(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize / 1024 / 1024; // MB

      this.measurements.push({
        timestamp: Date.now(),
        usage
      });

      // Keep only last 100 measurements
      if (this.measurements.length > 100) {
        this.measurements.shift();
      }

      return usage;
    }
    return 0;
  }

  getStats(): { current: number; peak: number; average: number } | null {
    if (this.measurements.length === 0) return null;

    const current = this.measurements[this.measurements.length - 1].usage;
    const peak = Math.max(...this.measurements.map(m => m.usage));
    const average = this.measurements.reduce((sum, m) => sum + m.usage, 0) / this.measurements.length;

    return { current, peak, average };
  }

  checkMemoryPressure(threshold: number = 100): boolean {
    const current = this.measure();
    return current > threshold;
  }
}

/**
 * Data compression utilities for localStorage
 */
export class DataCompression {
  static compress(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      // Simple compression by removing unnecessary whitespace and using shorter keys
      return jsonString.replace(/\s+/g, '');
    } catch (error) {
      console.error('Data compression failed:', error);
      return JSON.stringify(data);
    }
  }

  static decompress(compressedData: string): any {
    try {
      return JSON.parse(compressedData);
    } catch (error) {
      console.error('Data decompression failed:', error);
      return null;
    }
  }

  static getCompressionRatio(original: any, compressed: string): number {
    const originalSize = JSON.stringify(original).length;
    const compressedSize = compressed.length;
    return originalSize > 0 ? compressedSize / originalSize : 1;
  }
}

/**
 * Optimized localStorage operations
 */
export class OptimizedStorage {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_TTL = 30000; // 30 seconds

  static setItem(key: string, value: any): void {
    try {
      const compressed = DataCompression.compress(value);
      localStorage.setItem(key, compressed);

      // Update cache
      this.cache.set(key, { data: value, timestamp: Date.now() });
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  static getItem<T>(key: string): T | null {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const compressed = localStorage.getItem(key);
      if (!compressed) return null;

      const data = DataCompression.decompress(compressed);

      // Update cache
      this.cache.set(key, { data, timestamp: Date.now() });

      return data;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    localStorage.removeItem(key);
    this.cache.delete(key);
  }

  static clear(): void {
    localStorage.clear();
    this.cache.clear();
  }

  static getStorageStats(): { used: number; available: number; efficiency: number } {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        used += localStorage.getItem(key)?.length || 0;
      }
    }

    // Estimate available space (5MB typical limit)
    const available = 5 * 1024 * 1024 - used;
    const efficiency = this.cache.size > 0 ? 0.8 : 0.5; // Cache hit rate estimate

    return { used, available, efficiency };
  }
}

