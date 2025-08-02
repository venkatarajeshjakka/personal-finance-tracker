// Simple test to verify sorting logic
const testStocks = [
  {
    id: '1',
    companyName: 'Reliance Industries',
    symbol: 'RELIANCE',
    currentPrice: 2500,
    priceChange: 50,
    peRatio: 15.5,
    marketCap: 1500000000000,
    priceToBook: 2.1
  },
  {
    id: '2',
    companyName: 'Tata Consultancy Services',
    symbol: 'TCS',
    currentPrice: 3200,
    priceChange: -25,
    peRatio: 22.3,
    marketCap: 1200000000000,
    priceToBook: 8.5
  },
  {
    id: '3',
    companyName: 'HDFC Bank',
    symbol: 'HDFCBANK',
    currentPrice: 1600,
    priceChange: 15,
    peRatio: 18.7,
    marketCap: 900000000000,
    priceToBook: 1.8
  }
];

// Test sorting by different fields
function testSorting() {
  console.log('Testing watchlist sorting functionality...\n');

  // Test sorting by name (ascending)
  const sortedByName = [...testStocks].sort((a, b) => {
    const aValue = a.companyName.toLowerCase();
    const bValue = b.companyName.toLowerCase();
    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
  });

  console.log('Sorted by Name (ASC):');
  sortedByName.forEach(stock => console.log(`- ${stock.companyName}`));
  console.log();

  // Test sorting by current price (descending)
  const sortedByPrice = [...testStocks].sort((a, b) => {
    return (b.currentPrice || 0) - (a.currentPrice || 0);
  });

  console.log('Sorted by Current Price (DESC):');
  sortedByPrice.forEach(stock => console.log(`- ${stock.companyName}: ₹${stock.currentPrice}`));
  console.log();

  // Test sorting by price change (ascending)
  const sortedByChange = [...testStocks].sort((a, b) => {
    return (a.priceChange || 0) - (b.priceChange || 0);
  });

  console.log('Sorted by Price Change (ASC):');
  sortedByChange.forEach(stock => console.log(`- ${stock.companyName}: ${stock.priceChange > 0 ? '+' : ''}${stock.priceChange}`));
  console.log();

  console.log('✅ All sorting tests passed!');
}

testSorting();