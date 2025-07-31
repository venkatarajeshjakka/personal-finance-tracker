/**
 * Utility functions for consistent date formatting across server and client
 * to prevent hydration mismatches
 */

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  
  // Use a consistent format that works the same on server and client
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${month}/${day}/${year}`;
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  
  // Use a consistent format that works the same on server and client
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${month}/${day}/${year}, ${hours}:${minutes}`;
}

export function formatCurrency(value: number): string {
  // Use a consistent format for currency that works the same on server and client
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatNumber(value: number, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string {
  // Use a consistent format for numbers that works the same on server and client
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2
  }).format(value);
}