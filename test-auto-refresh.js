// Test auto-refresh interval calculation
const DEFAULT_PRICE_UPDATE_SETTINGS = {
  refreshInterval: 3600000, // 1 hour in milliseconds
  marketHoursOnly: true,
  checkMarketHolidays: true,
  autoRefreshEnabled: true
};

function getRefreshIntervalLabel(interval) {
  const minutes = interval / (1000 * 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = minutes / 60;
  return `${hours} hr`;
}

console.log('Testing auto-refresh settings...\n');

console.log('Default settings:');
console.log('- Refresh Interval:', DEFAULT_PRICE_UPDATE_SETTINGS.refreshInterval, 'ms');
console.log('- Refresh Interval Label:', getRefreshIntervalLabel(DEFAULT_PRICE_UPDATE_SETTINGS.refreshInterval));
console.log('- Auto Refresh Enabled:', DEFAULT_PRICE_UPDATE_SETTINGS.autoRefreshEnabled);
console.log('- Market Hours Only:', DEFAULT_PRICE_UPDATE_SETTINGS.marketHoursOnly);
console.log('- Check Market Holidays:', DEFAULT_PRICE_UPDATE_SETTINGS.checkMarketHolidays);

console.log('\nInterval calculations:');
console.log('- 1 minute:', getRefreshIntervalLabel(60000));
console.log('- 5 minutes:', getRefreshIntervalLabel(300000));
console.log('- 15 minutes:', getRefreshIntervalLabel(900000));
console.log('- 30 minutes:', getRefreshIntervalLabel(1800000));
console.log('- 1 hour:', getRefreshIntervalLabel(3600000));
console.log('- 2 hours:', getRefreshIntervalLabel(7200000));

// Test market status simulation
function simulateMarketStatus() {
  const now = new Date();
  const currentHour = now.getHours();
  
  console.log('\nCurrent time simulation:');
  console.log('- Current hour:', currentHour);
  console.log('- Is likely market hours (9-15):', currentHour >= 9 && currentHour < 15);
  console.log('- Is weekend:', now.getDay() === 0 || now.getDay() === 6);
}

simulateMarketStatus();

console.log('\n✅ Auto-refresh test completed!');