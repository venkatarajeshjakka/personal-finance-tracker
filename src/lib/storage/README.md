# Company Financial Data Import and Processing

This module implements comprehensive JSON data import functionality for company financial data, supporting both single company and multiple companies formats with automatic quarter categorization and data validation.

## Features

### 1. JSON Format Support
- **Single Company Format**: JSON with a `company` key containing one company's data
- **Multiple Companies Format**: JSON with a `companies` array containing multiple companies' data
- **Automatic Format Detection**: Automatically detects and validates the input format

### 2. Quarter Categorization
Implements the specific quarter mapping requirement:
- **Jun** → **Q1** (June = Quarter 1)
- **Sep** → **Q2** (September = Quarter 2) 
- **Dec** → **Q3** (December = Quarter 3)
- **Mar** → **Q4** (March = Quarter 4)

### 3. Data Validation
- Validates all required fields (company name, price, market cap, PE ratio)
- Validates YOY growth data structure
- Validates quarter data with proper type conversion
- Provides detailed error messages for validation failures

### 4. Error Handling
- Comprehensive error handling for invalid JSON
- Format-specific validation errors
- Graceful handling of localStorage errors
- User-friendly error messages

## Usage Examples

### Single Company Import

```typescript
import { StorageService } from '@/lib/storage';

const singleCompanyJSON = JSON.stringify({
  company: {
    name: 'Tech Corp',
    price: '$150.00',
    market_cap: '$15B',
    PE_ratio: '25.0',
    financials: {
      YOY: {
        sales_growth: '20%',
        EBIDT_growth: '25%',
        net_profit_growth: '18%',
        EPS_growth: '22%'
      },
      quarters: {
        'Jun-2024': { sales: 5000000, EBIDT: 1000000, net_profit: 750000, EPS: '12.50' },
        'Sep-2024': { sales: 5500000, EBIDT: 1100000, net_profit: 825000, EPS: '13.75' }
      }
    }
  }
});

const result = StorageService.importCompanyData(singleCompanyJSON);
if (result.isValid) {
  console.log('Imported companies:', result.data);
  // Quarters will be automatically normalized to Q1-2024, Q2-2024, etc.
} else {
  console.error('Import failed:', result.errors);
}
```

### Multiple Companies Import

```typescript
const multipleCompaniesJSON = JSON.stringify({
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
          'Dec-2024': { sales: 500000, EBIDT: 100000, net_profit: 75000, EPS: '1.25' }
        }
      }
    },
    {
      name: 'Company B',
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
          'Mar-2025': { sales: 800000, EBIDT: 160000, net_profit: 120000, EPS: '2.00' }
        }
      }
    }
  ]
});

const result = StorageService.importCompanyData(multipleCompaniesJSON);
// Will import both companies with quarters normalized to Q3-2024 and Q4-2025
```

## API Reference

### StorageService.importCompanyData(jsonData: string)

Imports company financial data from JSON string.

**Parameters:**
- `jsonData` (string): JSON string containing company data in either single or multiple format

**Returns:**
```typescript
ValidationResult<CompanyFinancials[]> {
  isValid: boolean;
  data?: CompanyFinancials[];
  errors: string[];
}
```

### Utility Functions

#### categorizeQuarter(monthYear: string): string
Converts month-year strings to quarter format.

```typescript
categorizeQuarter('Jun-2024') // Returns 'Q1-2024'
categorizeQuarter('Sep-2024') // Returns 'Q2-2024'
categorizeQuarter('Dec-2024') // Returns 'Q3-2024'
categorizeQuarter('Mar-2025') // Returns 'Q4-2025'
```

#### normalizeQuarterKeys(quarters: Record<string, QuarterData>): Record<string, QuarterData>
Normalizes all quarter keys in a quarters object.

#### detectAndValidateJSONFormat(jsonData: any): ValidationResult<CompanyJSONInput>
Detects and validates JSON format (single vs multiple companies).

#### normalizeCompanyData(jsonInput: CompanyJSONInput): CompanyFinancials[]
Converts validated JSON input to internal CompanyFinancials format.

## Data Structures

### Input Formats

#### Single Company Format
```typescript
{
  company: {
    name: string;
    price: string;
    market_cap: string;
    PE_ratio: string;
    financials: {
      YOY: {
        sales_growth: string;
        EBIDT_growth: string;
        net_profit_growth: string;
        EPS_growth: string;
      };
      quarters: Record<string, QuarterData>;
    };
  }
}
```

#### Multiple Companies Format
```typescript
{
  companies: Array<{
    name: string;
    price: string;
    market_cap: string;
    PE_ratio: string;
    financials: {
      YOY: {
        sales_growth: string;
        EBIDT_growth: string;
        net_profit_growth: string;
        EPS_growth: string;
      };
      quarters: Record<string, QuarterData>;
    };
  }>
}
```

### Internal Format (CompanyFinancials)
```typescript
{
  id: string;
  company: string;
  price: string;
  market_cap: string;
  PE_ratio: string;
  financials: {
    YOY: {
      sales_growth: string;
      EBIDT_growth: string;
      net_profit_growth: string;
      EPS_growth: string;
    };
    quarters: Record<string, QuarterData>; // Keys normalized to Q1-YYYY format
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### QuarterData
```typescript
{
  sales: number;
  EBIDT: number;
  net_profit: number;
  EPS: string;
}
```

## Error Handling

The import functionality provides detailed error messages for various failure scenarios:

### Validation Errors
- Missing required fields (name, price, market_cap, PE_ratio)
- Invalid YOY growth data structure
- Invalid quarter data (non-numeric values, missing fields)
- Invalid JSON structure

### Format-Specific Errors
- Single company format: Errors prefixed with "Company:"
- Multiple companies format: Errors prefixed with "Company N:" (where N is the company index)

### Example Error Response
```typescript
{
  isValid: false,
  errors: [
    "Company 1: Invalid or missing price",
    "Company 1: YOY: Invalid EBIDT_growth value",
    "Company 2: Quarter Q1-2024: Invalid sales value"
  ]
}
```

## Testing

The implementation includes comprehensive tests covering:

1. **Quarter Categorization**: Tests all month mappings and edge cases
2. **Format Detection**: Tests both single and multiple company formats
3. **Data Validation**: Tests field validation and type conversion
4. **Error Handling**: Tests invalid inputs and error message generation
5. **Integration**: Tests end-to-end import functionality with localStorage

### Running Tests

```bash
# Run validation script
node validate-import.js

# Run integration tests
node test-storage-integration.js
```

## Requirements Satisfied

This implementation satisfies all requirements from task 5:

✅ **Create JSON data import functionality** - Supports both single and multiple company formats  
✅ **Build data validation and parsing logic** - Comprehensive validation with detailed error messages  
✅ **Implement quarter categorization logic** - Jun=Q1, Sep=Q2, Dec=Q3, Mar=Q4  
✅ **Add data normalization** - Converts both formats to consistent internal structure  
✅ **Add comprehensive error handling** - Format-specific validation and user feedback  
✅ **Create unit tests** - Comprehensive test coverage for all scenarios  

The implementation handles both JSON formats seamlessly, automatically detects the format, validates all data, normalizes quarter keys according to the specified mapping, and provides detailed error feedback for any validation failures.