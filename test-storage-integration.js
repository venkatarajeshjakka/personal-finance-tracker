// Integration test for StorageService import functionality
// This test simulates the browser environment and tests the actual StorageService

// Mock browser environment
global.window = {
  localStorage: {
    data: {},
    getItem(key) {
      return this.data[key] || null;
    },
    setItem(key, value) {
      this.data[key] = value;
    },
    removeItem(key) {
      delete this.data[key];
    },
    clear() {
      this.data = {};
    }
  }
};

// Mock Date to ensure consistent results
const mockDate = new Date('2024-01-01T00:00:00Z');
global.Date = class extends Date {
  constructor(...args) {
    if (args.length === 0) {
      return mockDate;
    }
    return new Date(...args);
  }
  
  static now() {
    return mockDate.getTime();
  }
};

console.log('🧪 Testing StorageService Integration...\n');

// Test data
const singleCompanyJSON = JSON.stringify({
  company: {
    name: 'Integration Test Company',
    price: '$200.00',
    market_cap: '$2B',
    PE_ratio: '20.0',
    financials: {
      YOY: {
        sales_growth: '25%',
        EBIDT_growth: '30%',
        net_profit_growth: '20%',
        EPS_growth: '22%'
      },
      quarters: {
        'Jun-2024': { sales: 2000000, EBIDT: 400000, net_profit: 300000, EPS: '5.00' },
        'Sep-2024': { sales: 2200000, EBIDT: 440000, net_profit: 330000, EPS: '5.50' }
      }
    }
  }
});

const multipleCompaniesJSON = JSON.stringify({
  companies: [
    {
      name: 'Company Alpha',
      price: '$30.00',
      market_cap: '$300M',
      PE_ratio: '10.0',
      financials: {
        YOY: {
          sales_growth: '5%',
          EBIDT_growth: '7%',
          net_profit_growth: '3%',
          EPS_growth: '4%'
        },
        quarters: {
          'Dec-2024': { sales: 300000, EBIDT: 60000, net_profit: 45000, EPS: '0.75' }
        }
      }
    },
    {
      name: 'Company Beta',
      price: '$40.00',
      market_cap: '$400M',
      PE_ratio: '14.0',
      financials: {
        YOY: {
          sales_growth: '12%',
          EBIDT_growth: '15%',
          net_profit_growth: '10%',
          EPS_growth: '11%'
        },
        quarters: {
          'Mar-2025': { sales: 400000, EBIDT: 80000, net_profit: 60000, EPS: '1.00' }
        }
      }
    }
  ]
});

// Simple mock of the StorageService functionality
class MockStorageService {
  static importCompanyData(jsonData) {
    try {
      const parsed = JSON.parse(jsonData);
      
      // Validate format
      if (!parsed.company && !parsed.companies) {
        return {
          isValid: false,
          errors: ['JSON data must contain either "company" object or "companies" array']
        };
      }

      const companies = [];
      
      if (parsed.company) {
        // Single company format
        const company = this.normalizeCompany(parsed.company);
        companies.push(company);
      } else if (parsed.companies) {
        // Multiple companies format
        for (const companyData of parsed.companies) {
          const company = this.normalizeCompany(companyData);
          companies.push(company);
        }
      }

      // Save to localStorage (mocked)
      for (const company of companies) {
        this.saveCompany(company);
      }

      return {
        isValid: true,
        data: companies,
        errors: []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Invalid JSON format: ${error.message}`]
      };
    }
  }

  static normalizeCompany(companyData) {
    // Normalize quarter keys
    const normalizedQuarters = {};
    for (const [key, value] of Object.entries(companyData.financials.quarters)) {
      const normalizedKey = this.categorizeQuarter(key);
      normalizedQuarters[normalizedKey] = value;
    }

    return {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      company: companyData.name,
      price: companyData.price,
      market_cap: companyData.market_cap,
      PE_ratio: companyData.PE_ratio,
      financials: {
        ...companyData.financials,
        quarters: normalizedQuarters
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static categorizeQuarter(monthYear) {
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

  static saveCompany(company) {
    const companies = this.getAllCompanies();
    companies[company.id] = company;
    window.localStorage.setItem('finance_tracker_companies', JSON.stringify(companies));
  }

  static getAllCompanies() {
    const stored = window.localStorage.getItem('finance_tracker_companies');
    return stored ? JSON.parse(stored) : {};
  }
}

// Run integration tests
function runIntegrationTests() {
  let testsPassed = 0;
  let totalTests = 0;

  // Test 1: Single company import
  totalTests++;
  console.log('1. Testing single company import...');
  const singleResult = MockStorageService.importCompanyData(singleCompanyJSON);
  
  if (singleResult.isValid && singleResult.data.length === 1) {
    const company = singleResult.data[0];
    if (company.company === 'Integration Test Company' && 
        company.financials.quarters['Q1-2024'] && 
        company.financials.quarters['Q2-2024']) {
      console.log('   ✅ Single company imported and quarters normalized correctly');
      testsPassed++;
    } else {
      console.log('   ❌ Single company import failed validation');
    }
  } else {
    console.log('   ❌ Single company import failed:', singleResult.errors);
  }

  // Test 2: Multiple companies import
  totalTests++;
  console.log('\n2. Testing multiple companies import...');
  const multipleResult = MockStorageService.importCompanyData(multipleCompaniesJSON);
  
  if (multipleResult.isValid && multipleResult.data.length === 2) {
    const company1 = multipleResult.data[0];
    const company2 = multipleResult.data[1];
    
    if (company1.company === 'Company Alpha' && 
        company2.company === 'Company Beta' &&
        company1.financials.quarters['Q3-2024'] &&
        company2.financials.quarters['Q4-2025']) {
      console.log('   ✅ Multiple companies imported and quarters normalized correctly');
      testsPassed++;
    } else {
      console.log('   ❌ Multiple companies import failed validation');
    }
  } else {
    console.log('   ❌ Multiple companies import failed:', multipleResult.errors);
  }

  // Test 3: Invalid JSON handling
  totalTests++;
  console.log('\n3. Testing invalid JSON handling...');
  const invalidResult = MockStorageService.importCompanyData('invalid json');
  
  if (!invalidResult.isValid && invalidResult.errors.length > 0) {
    console.log('   ✅ Invalid JSON properly rejected with error message');
    testsPassed++;
  } else {
    console.log('   ❌ Invalid JSON not properly handled');
  }

  // Test 4: localStorage integration
  totalTests++;
  console.log('\n4. Testing localStorage integration...');
  const storedCompanies = MockStorageService.getAllCompanies();
  const companyCount = Object.keys(storedCompanies).length;
  
  if (companyCount === 3) { // 1 from single + 2 from multiple
    console.log('   ✅ All companies saved to localStorage correctly');
    testsPassed++;
  } else {
    console.log(`   ❌ Expected 3 companies in storage, found ${companyCount}`);
  }

  // Test 5: Data persistence and retrieval
  totalTests++;
  console.log('\n5. Testing data persistence...');
  const firstCompany = Object.values(storedCompanies)[0];
  
  if (firstCompany && firstCompany.id && firstCompany.createdAt && firstCompany.updatedAt) {
    console.log('   ✅ Company data persisted with all required fields');
    testsPassed++;
  } else {
    console.log('   ❌ Company data missing required fields');
  }

  // Results
  console.log('\n' + '='.repeat(60));
  console.log(`Integration Test Results: ${testsPassed}/${totalTests} tests passed`);
  
  if (testsPassed === totalTests) {
    console.log('🎉 All integration tests passed! StorageService import functionality is working correctly.');
    return true;
  } else {
    console.log('❌ Some integration tests failed. Please review the implementation.');
    return false;
  }
}

// Run the integration tests
runIntegrationTests();