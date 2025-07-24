import { StorageService } from './index';
import { detectAndValidateJSONFormat, normalizeCompanyData, categorizeQuarter } from './utils';

// Test data for validation
const singleCompanyTestData = {
  company: {
    name: 'Test Company A',
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
        'Jun-2024': { sales: 1000000, EBIDT: 200000, net_profit: 150000, EPS: '2.50' },
        'Sep-2024': { sales: 1100000, EBIDT: 220000, net_profit: 165000, EPS: '2.75' },
        'Dec-2024': { sales: 1200000, EBIDT: 240000, net_profit: 180000, EPS: '3.00' },
        'Mar-2025': { sales: 1300000, EBIDT: 260000, net_profit: 195000, EPS: '3.25' }
      }
    }
  }
};

const multipleCompaniesTestData = {
  companies: [
    {
      name: 'Company X',
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
          'Jun-2024': { sales: 500000, EBIDT: 100000, net_profit: 75000, EPS: '1.25' }
        }
      }
    },
    {
      name: 'Company Y',
      price: '$75.00',
      market_cap: '$750M',
      PE_ratio: '18.5',
      financials: {
        YOY: {
          sales_growth: '8%',
          EBIDT_growth: '10%',
          net_profit_growth: '6%',
          EPS_growth: '7%'
        },
        quarters: {
          'Sep-2024': { sales: 800000, EBIDT: 160000, net_profit: 120000, EPS: '2.00' }
        }
      }
    }
  ]
};

export function validateImportFunctionality(): boolean {
  console.log('🧪 Testing Company Data Import and Processing...\n');

  try {
    // Test 1: Quarter Categorization
    console.log('1. Testing Quarter Categorization:');
    const quarterTests = [
      { input: 'Jun-2024', expected: 'Q1-2024' },
      { input: 'Sep-2024', expected: 'Q2-2024' },
      { input: 'Dec-2024', expected: 'Q3-2024' },
      { input: 'Mar-2025', expected: 'Q4-2025' }
    ];

    for (const test of quarterTests) {
      const result = categorizeQuarter(test.input);
      if (result === test.expected) {
        console.log(`   ✅ ${test.input} → ${result}`);
      } else {
        console.log(`   ❌ ${test.input} → ${result} (expected ${test.expected})`);
        return false;
      }
    }

    // Test 2: Single Company Format Detection
    console.log('\n2. Testing Single Company Format Detection:');
    const singleValidation = detectAndValidateJSONFormat(singleCompanyTestData);
    if (singleValidation.isValid) {
      console.log('   ✅ Single company format detected and validated');
      console.log(`   ✅ Company name: ${singleValidation.data!.company.name}`);
    } else {
      console.log('   ❌ Single company format validation failed:', singleValidation.errors);
      return false;
    }

    // Test 3: Multiple Companies Format Detection
    console.log('\n3. Testing Multiple Companies Format Detection:');
    const multipleValidation = detectAndValidateJSONFormat(multipleCompaniesTestData);
    if (multipleValidation.isValid) {
      console.log('   ✅ Multiple companies format detected and validated');
      console.log(`   ✅ Number of companies: ${multipleValidation.data!.companies.length}`);
    } else {
      console.log('   ❌ Multiple companies format validation failed:', multipleValidation.errors);
      return false;
    }

    // Test 4: Data Normalization with Quarter Categorization
    console.log('\n4. Testing Data Normalization:');
    const normalizedSingle = normalizeCompanyData(singleValidation.data!);
    const normalizedMultiple = normalizeCompanyData(multipleValidation.data!);

    if (normalizedSingle.length === 1) {
      console.log('   ✅ Single company normalized correctly');
      const company = normalizedSingle[0];
      
      // Check quarter normalization
      const quarters = Object.keys(company.financials.quarters);
      const expectedQuarters = ['Q1-2024', 'Q2-2024', 'Q3-2024', 'Q4-2025'];
      const hasCorrectQuarters = expectedQuarters.every(q => quarters.includes(q));
      
      if (hasCorrectQuarters) {
        console.log('   ✅ Quarter keys normalized correctly:', quarters);
      } else {
        console.log('   ❌ Quarter normalization failed. Got:', quarters);
        return false;
      }
    } else {
      console.log('   ❌ Single company normalization failed');
      return false;
    }

    if (normalizedMultiple.length === 2) {
      console.log('   ✅ Multiple companies normalized correctly');
      console.log(`   ✅ Company 1: ${normalizedMultiple[0].company}`);
      console.log(`   ✅ Company 2: ${normalizedMultiple[1].company}`);
      
      // Check quarter normalization for multiple companies
      const company1Quarters = Object.keys(normalizedMultiple[0].financials.quarters);
      const company2Quarters = Object.keys(normalizedMultiple[1].financials.quarters);
      
      if (company1Quarters.includes('Q1-2024') && company2Quarters.includes('Q2-2024')) {
        console.log('   ✅ Quarter keys normalized correctly for multiple companies');
      } else {
        console.log('   ❌ Quarter normalization failed for multiple companies');
        return false;
      }
    } else {
      console.log('   ❌ Multiple companies normalization failed');
      return false;
    }

    // Test 5: Error Handling
    console.log('\n5. Testing Error Handling:');
    
    // Test invalid JSON structure
    const invalidData = { invalidKey: 'value' };
    const invalidValidation = detectAndValidateJSONFormat(invalidData);
    if (!invalidValidation.isValid && invalidValidation.errors.length > 0) {
      console.log('   ✅ Invalid data properly rejected with errors');
    } else {
      console.log('   ❌ Invalid data not properly rejected');
      return false;
    }

    // Test missing required fields
    const incompleteData = {
      company: {
        name: 'Incomplete Company'
        // Missing other required fields
      }
    };
    const incompleteValidation = detectAndValidateJSONFormat(incompleteData);
    if (!incompleteValidation.isValid && incompleteValidation.errors.length > 0) {
      console.log('   ✅ Incomplete data properly rejected with specific errors');
    } else {
      console.log('   ❌ Incomplete data not properly rejected');
      return false;
    }

    console.log('\n🎉 All tests passed! Company data import and processing is working correctly.');
    return true;

  } catch (error) {
    console.error('❌ Validation failed with error:', error);
    return false;
  }
}

// Run validation if this file is executed directly
if (typeof window === 'undefined') {
  validateImportFunctionality();
}