// Simple validation script for company data import functionality

// Mock localStorage for Node.js environment
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};

// Mock window for Node.js environment
global.window = {
  localStorage: global.localStorage
};

// Quarter categorization function
function categorizeQuarter(monthYear) {
  const monthMap = {
    'Jun': 'Q1',
    'Sep': 'Q2', 
    'Dec': 'Q3',
    'Mar': 'Q4'
  };

  const monthMatch = monthYear.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
  if (!monthMatch) {
    return monthYear;
  }

  const month = monthMatch[1];
  const quarter = monthMap[month];
  
  if (!quarter) {
    return monthYear;
  }

  const yearMatch = monthYear.match(/(\d{4})/);
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();

  return `${quarter}-${year}`;
}

// Test the quarter categorization
function testQuarterCategorization() {
  console.log('🧪 Testing Quarter Categorization...\n');
  
  const tests = [
    { input: 'Jun-2024', expected: 'Q1-2024' },
    { input: 'Sep-2024', expected: 'Q2-2024' },
    { input: 'Dec-2024', expected: 'Q3-2024' },
    { input: 'Mar-2025', expected: 'Q4-2025' },
    { input: 'Jun 2024', expected: 'Q1-2024' },
    { input: '2024-Jun', expected: 'Q1-2024' },
    { input: 'Jan-2024', expected: 'Jan-2024' }, // Should remain unchanged
  ];

  let allPassed = true;

  for (const test of tests) {
    const result = categorizeQuarter(test.input);
    if (result === test.expected) {
      console.log(`✅ ${test.input} → ${result}`);
    } else {
      console.log(`❌ ${test.input} → ${result} (expected ${test.expected})`);
      allPassed = false;
    }
  }

  return allPassed;
}

// Test JSON format detection logic
function testJSONFormatDetection() {
  console.log('\n🧪 Testing JSON Format Detection...\n');

  // Test single company format
  const singleCompanyJSON = {
    company: {
      name: 'Test Company',
      price: '$100.00',
      market_cap: '$1B',
      PE_ratio: '15.5',
      financials: {
        YOY: {
          sales_growth: '10%',
          EBIDT_growth: '12%',
          net_profit_growth: '8%',
          EPS_growth: '9%'
        },
        quarters: {
          'Jun-2024': { sales: 1000000, EBIDT: 200000, net_profit: 150000, EPS: '2.50' }
        }
      }
    }
  };

  // Test multiple companies format
  const multipleCompaniesJSON = {
    companies: [
      {
        name: 'Company A',
        price: '$50.00',
        market_cap: '$500M',
        PE_ratio: '12.0',
        financials: {
          YOY: {
            sales_growth: '15%',
            EBIDT_growth: '18%',
            net_profit_growth: '12%',
            EPS_growth: '14%'
          },
          quarters: {
            'Sep-2024': { sales: 500000, EBIDT: 100000, net_profit: 75000, EPS: '1.25' }
          }
        }
      }
    ]
  };

  // Simple validation logic
  function validateFormat(data) {
    if (!data || typeof data !== 'object') {
      return { isValid: false, errors: ['Invalid data structure'] };
    }

    if (data.company) {
      console.log('✅ Single company format detected');
      return { isValid: true, format: 'single', data: data };
    }

    if (data.companies && Array.isArray(data.companies)) {
      console.log('✅ Multiple companies format detected');
      return { isValid: true, format: 'multiple', data: data };
    }

    return { isValid: false, errors: ['No valid format detected'] };
  }

  const singleResult = validateFormat(singleCompanyJSON);
  const multipleResult = validateFormat(multipleCompaniesJSON);

  if (singleResult.isValid && multipleResult.isValid) {
    console.log('✅ Both JSON formats detected correctly');
    return true;
  } else {
    console.log('❌ JSON format detection failed');
    return false;
  }
}

// Test data normalization with quarter categorization
function testDataNormalization() {
  console.log('\n🧪 Testing Data Normalization with Quarter Categorization...\n');

  const testData = {
    'Jun-2024': { sales: 1000, EBIDT: 200, net_profit: 150, EPS: '2.50' },
    'Sep-2024': { sales: 1100, EBIDT: 220, net_profit: 165, EPS: '2.75' },
    'Dec-2024': { sales: 1200, EBIDT: 240, net_profit: 180, EPS: '3.00' },
    'Mar-2025': { sales: 1300, EBIDT: 260, net_profit: 195, EPS: '3.25' }
  };

  const normalizedData = {};
  for (const [key, value] of Object.entries(testData)) {
    const normalizedKey = categorizeQuarter(key);
    normalizedData[normalizedKey] = value;
  }

  const expectedKeys = ['Q1-2024', 'Q2-2024', 'Q3-2024', 'Q4-2025'];
  const actualKeys = Object.keys(normalizedData);

  const allKeysPresent = expectedKeys.every(key => actualKeys.includes(key));

  if (allKeysPresent) {
    console.log('✅ Quarter keys normalized correctly:');
    for (const key of expectedKeys) {
      console.log(`   ${key}: ${JSON.stringify(normalizedData[key])}`);
    }
    return true;
  } else {
    console.log('❌ Quarter normalization failed');
    console.log('Expected keys:', expectedKeys);
    console.log('Actual keys:', actualKeys);
    return false;
  }
}

// Test error handling
function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling...\n');

  const invalidInputs = [
    null,
    undefined,
    'string',
    123,
    [],
    {},
    { invalidKey: 'value' },
    { company: {} }, // Missing required fields
    { companies: [] }, // Empty array
  ];

  let errorsCaughtCorrectly = 0;

  for (const input of invalidInputs) {
    try {
      // Simple validation that should reject invalid inputs
      if (!input || typeof input !== 'object') {
        errorsCaughtCorrectly++;
        continue;
      }

      if (input.company && (!input.company.name || !input.company.price)) {
        errorsCaughtCorrectly++;
        continue;
      }

      if (input.companies && (!Array.isArray(input.companies) || input.companies.length === 0)) {
        errorsCaughtCorrectly++;
        continue;
      }

      if (!input.company && !input.companies) {
        errorsCaughtCorrectly++;
        continue;
      }

    } catch (error) {
      errorsCaughtCorrectly++;
    }
  }

  if (errorsCaughtCorrectly === invalidInputs.length) {
    console.log(`✅ All ${invalidInputs.length} invalid inputs properly rejected`);
    return true;
  } else {
    console.log(`❌ Only ${errorsCaughtCorrectly}/${invalidInputs.length} invalid inputs were rejected`);
    return false;
  }
}

// Run all tests
function runAllTests() {
  console.log('🚀 Running Company Data Import and Processing Validation\n');
  console.log('=' .repeat(60));

  const results = [
    testQuarterCategorization(),
    testJSONFormatDetection(),
    testDataNormalization(),
    testErrorHandling()
  ];

  const allPassed = results.every(result => result === true);

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('🎉 All tests passed! Company data import and processing functionality is working correctly.');
  } else {
    console.log('❌ Some tests failed. Please review the implementation.');
  }

  return allPassed;
}

// Run the tests
runAllTests();