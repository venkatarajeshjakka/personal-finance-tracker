/**
 * Mobile Detection Hook
 * Provides consistent mobile detection across components
 */

import { useState, useEffect } from 'react';

export interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  touchDevice: boolean;
}

/**
 * Hook for detecting mobile devices and screen properties
 */
export function useMobileDetection(): MobileDetectionResult {
  const [detection, setDetection] = useState<MobileDetectionResult>(() => {
    // Server-side safe defaults
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1024,
        screenHeight: 768,
        orientation: 'landscape',
        touchDevice: false
      };
    }

    // Client-side initial detection
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      screenWidth: width,
      screenHeight: height,
      orientation: width > height ? 'landscape' : 'portrait',
      touchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDetection = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setDetection({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        screenWidth: width,
        screenHeight: height,
        orientation: width > height ? 'landscape' : 'portrait',
        touchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
      });
    };

    // Update on resize
    window.addEventListener('resize', updateDetection);
    
    // Update on orientation change
    window.addEventListener('orientationchange', updateDetection);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateDetection);
      window.removeEventListener('orientationchange', updateDetection);
    };
  }, []);

  return detection;
}

/**
 * Hook for simple mobile detection (boolean only)
 */
export function useIsMobile(): boolean {
  const { isMobile } = useMobileDetection();
  return isMobile;
}

/**
 * Hook for responsive breakpoints
 */
export function useBreakpoint() {
  const { screenWidth } = useMobileDetection();
  
  return {
    xs: screenWidth < 480,
    sm: screenWidth >= 480 && screenWidth < 768,
    md: screenWidth >= 768 && screenWidth < 1024,
    lg: screenWidth >= 1024 && screenWidth < 1280,
    xl: screenWidth >= 1280 && screenWidth < 1536,
    '2xl': screenWidth >= 1536,
    mobile: screenWidth < 768,
    tablet: screenWidth >= 768 && screenWidth < 1024,
    desktop: screenWidth >= 1024
  };
}

/**
 * Hook for touch device detection
 */
export function useIsTouchDevice(): boolean {
  const { touchDevice } = useMobileDetection();
  return touchDevice;
}