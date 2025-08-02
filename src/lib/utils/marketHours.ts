/**
 * Market hours and holiday utilities for NSE (National Stock Exchange of India)
 */

export interface MarketStatus {
  isOpen: boolean;
  isHoliday: boolean;
  nextOpenTime?: Date;
  nextCloseTime?: Date;
  marketState: 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'POST_MARKET' | 'HOLIDAY';
}

// NSE market hours (IST)
const MARKET_OPEN_HOUR = 9;
const MARKET_OPEN_MINUTE = 15;
const MARKET_CLOSE_HOUR = 15;
const MARKET_CLOSE_MINUTE = 30;

// Pre-market hours
const PRE_MARKET_OPEN_HOUR = 9;
const PRE_MARKET_OPEN_MINUTE = 0;

// Post-market hours
const POST_MARKET_CLOSE_HOUR = 16;
const POST_MARKET_CLOSE_MINUTE = 0;

// NSE holidays for 2025 (this should be updated annually or fetched from an API)
const NSE_HOLIDAYS_2025 = [
  '2025-01-26', // Republic Day
  '2025-03-14', // Holi
  '2025-03-31', // Ram Navami
  '2025-04-14', // Mahavir Jayanti
  '2025-04-18', // Good Friday
  '2025-05-01', // Maharashtra Day
  '2025-08-15', // Independence Day
  '2025-08-16', // Parsi New Year
  '2025-09-07', // Ganesh Chaturthi
  '2025-10-02', // Gandhi Jayanti
  '2025-10-21', // Dussehra
  '2025-11-01', // Diwali Laxmi Pujan
  '2025-11-02', // Diwali Balipratipada
  '2025-11-05', // Bhai Dooj
  '2025-11-24', // Guru Nanak Jayanti
  '2025-12-25', // Christmas
];

/**
 * Check if a given date is a market holiday
 */
export function isMarketHoliday(date: Date = new Date()): boolean {
  const dateString = date.toISOString().split('T')[0];
  return NSE_HOLIDAYS_2025.includes(dateString);
}

/**
 * Check if a given date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date = new Date()): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Get the current market status
 */
export function getMarketStatus(date: Date = new Date()): MarketStatus {
  // Check if it's a holiday
  if (isMarketHoliday(date)) {
    return {
      isOpen: false,
      isHoliday: true,
      marketState: 'HOLIDAY'
    };
  }

  // Check if it's a weekend
  if (isWeekend(date)) {
    return {
      isOpen: false,
      isHoliday: false,
      marketState: 'CLOSED'
    };
  }

  const currentTime = date.getHours() * 60 + date.getMinutes();
  const marketOpenTime = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE;
  const marketCloseTime = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MINUTE;
  const preMarketOpenTime = PRE_MARKET_OPEN_HOUR * 60 + PRE_MARKET_OPEN_MINUTE;
  const postMarketCloseTime = POST_MARKET_CLOSE_HOUR * 60 + POST_MARKET_CLOSE_MINUTE;

  let marketState: MarketStatus['marketState'];
  let isOpen = false;

  if (currentTime >= marketOpenTime && currentTime < marketCloseTime) {
    marketState = 'OPEN';
    isOpen = true;
  } else if (currentTime >= preMarketOpenTime && currentTime < marketOpenTime) {
    marketState = 'PRE_MARKET';
    isOpen = false;
  } else if (currentTime >= marketCloseTime && currentTime < postMarketCloseTime) {
    marketState = 'POST_MARKET';
    isOpen = false;
  } else {
    marketState = 'CLOSED';
    isOpen = false;
  }

  return {
    isOpen,
    isHoliday: false,
    marketState,
    nextOpenTime: getNextMarketOpenTime(date),
    nextCloseTime: getNextMarketCloseTime(date)
  };
}

/**
 * Get the next market open time
 */
function getNextMarketOpenTime(date: Date): Date {
  const nextOpen = new Date(date);
  
  // Check if market is currently open by calculating directly (avoid circular dependency)
  const currentTime = date.getHours() * 60 + date.getMinutes();
  const marketOpenTime = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE;
  const marketCloseTime = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MINUTE;
  
  const isCurrentlyOpen = !isWeekend(date) && !isMarketHoliday(date) && 
                         currentTime >= marketOpenTime && currentTime < marketCloseTime;
  
  // If market is currently open, return tomorrow's open time
  if (isCurrentlyOpen) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }

  // Find next trading day
  while (isWeekend(nextOpen) || isMarketHoliday(nextOpen)) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }

  nextOpen.setHours(MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, 0, 0);
  return nextOpen;
}

/**
 * Get the next market close time
 */
function getNextMarketCloseTime(date: Date): Date {
  const nextClose = new Date(date);
  
  // Check if market is currently open by calculating directly (avoid circular dependency)
  const currentTime = date.getHours() * 60 + date.getMinutes();
  const marketOpenTime = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE;
  const marketCloseTime = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MINUTE;
  
  const isCurrentlyOpen = !isWeekend(date) && !isMarketHoliday(date) && 
                         currentTime >= marketOpenTime && currentTime < marketCloseTime;
  
  // If market is closed, return today's close time if it's a trading day
  if (!isCurrentlyOpen && !isWeekend(date) && !isMarketHoliday(date)) {
    if (currentTime < marketCloseTime) {
      nextClose.setHours(MARKET_CLOSE_HOUR, MARKET_CLOSE_MINUTE, 0, 0);
      return nextClose;
    }
  }

  // Find next trading day
  while (isWeekend(nextClose) || isMarketHoliday(nextClose)) {
    nextClose.setDate(nextClose.getDate() + 1);
  }

  nextClose.setHours(MARKET_CLOSE_HOUR, MARKET_CLOSE_MINUTE, 0, 0);
  return nextClose;
}

/**
 * Check if we should update prices based on market status and settings
 */
export function shouldUpdatePrices(
  marketHoursOnly: boolean = true,
  checkHolidays: boolean = true
): boolean {
  const status = getMarketStatus();

  // If we don't care about market hours, always update
  if (!marketHoursOnly && !checkHolidays) {
    return true;
  }

  // Don't update on holidays if checking holidays
  if (checkHolidays && status.isHoliday) {
    return false;
  }

  // Don't update outside market hours if marketHoursOnly is true
  if (marketHoursOnly && !status.isOpen) {
    return false;
  }

  return true;
}

/**
 * Get time until next market open (in milliseconds)
 */
export function getTimeUntilMarketOpen(): number {
  const status = getMarketStatus();
  if (status.nextOpenTime) {
    return status.nextOpenTime.getTime() - Date.now();
  }
  return 0;
}

/**
 * Get time until market close (in milliseconds)
 */
export function getTimeUntilMarketClose(): number {
  const status = getMarketStatus();
  if (status.nextCloseTime) {
    return status.nextCloseTime.getTime() - Date.now();
  }
  return 0;
}