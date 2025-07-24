import { 
  CompanyFinancials, 
  SingleCompanyJSONFormat, 
  MultipleCompaniesJSONFormat,
  CompanyJSONInput,
  ValidationResult,
  DataError,
  QuarterData
} from '@/types';

/**
 * Generate a unique ID for entities
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Validate quarter data structure
 */
export function validateQuarterData(quarters: Record<string, any>): ValidationResult<Record<string, QuarterData>> {
  const errors: string[] = [];
  const validatedQuarters: Record<string, QuarterData> = {};

  for (const [quarter, data] of Object.entries(quarters)) {
    if (!data || typeof data !== 'object') {
      errors.push(`Quarter ${quarter}: Invalid data structure`);
      continue;
    }

    const quarterData: Partial<QuarterData> = {};

    // Validate sales
    if (typeof data.sales === 'number') {
      quarterData.sales = data.sales;
    } else if (typeof data.sales === 'string' && !isNaN(Number(data.sales))) {
      quarterData.sales = Number(data.sales);
    } else {
      errors.push(`Quarter ${quarter}: Invalid sales value`);
    }

    // Validate EBIDT
    if (typeof data.EBIDT === 'number') {
      quarterData.EBIDT = data.EBIDT;
    } else if (typeof data.EBIDT === 'string' && !isNaN(Number(data.EBIDT))) {
      quarterData.EBIDT = Number(data.EBIDT);
    } else {
      errors.push(`Quarter ${quarter}: Invalid EBIDT value`);
    }

    // Validate net_profit
    if (typeof data.net_profit === 'number') {
      quarterData.net_profit = data.net_profit;
    } else if (typeof data.net_profit === 'string' && !isNaN(Number(data.net_profit))) {
      quarterData.net_profit = Number(data.net_profit);
    } else {
      errors.push(`Quarter ${quarter}: Invalid net_profit value`);
    }

    // Validate EPS (kept as string as per interface)
    if (typeof data.EPS === 'string') {
      quarterData.EPS = data.EPS;
    } else if (typeof data.EPS === 'number') {
      quarterData.EPS = data.EPS.toString();
    } else {
      errors.push(`Quarter ${quarter}: Invalid EPS value`);
    }

    if (quarterData.sales !== undefined && quarterData.EBIDT !== undefined && 
        quarterData.net_profit !== undefined && quarterData.EPS !== undefined) {
      validatedQuarters[quarter] = quarterData as QuarterData;
    }
  }

  return {
    isValid: errors.length === 0,
    data: validatedQuarters,
    errors
  };
}

/**
 * Validate YOY growth data
 */
function validateYOYData(yoy: any): ValidationResult<CompanyFinancials['financials']['YOY']> {
  const errors: string[] = [];

  if (!yoy || typeof yoy !== 'object') {
    return { isValid: false, errors: ['Invalid YOY data structure'] };
  }

  const requiredFields = ['sales_growth', 'EBIDT_growth', 'net_profit_growth', 'EPS_growth'];
  const validatedYOY: Partial<CompanyFinancials['financials']['YOY']> = {};

  for (const field of requiredFields) {
    if (typeof yoy[field] === 'string') {
      validatedYOY[field as keyof CompanyFinancials['financials']['YOY']] = yoy[field];
    } else {
      errors.push(`Invalid ${field} value`);
    }
  }

  return {
    isValid: errors.length === 0,
    data: validatedYOY as CompanyFinancials['financials']['YOY'],
    errors
  };
}

/**
 * Validate company financial data structure
 */
function validateCompanyData(company: any): ValidationResult<Omit<CompanyFinancials, 'id' | 'createdAt' | 'updatedAt'>> {
  const errors: string[] = [];

  if (!company || typeof company !== 'object') {
    return { isValid: false, errors: ['Invalid company data structure'] };
  }

  // Validate required string fields
  const requiredStringFields = ['name', 'price', 'market_cap', 'PE_ratio'];
  const validatedCompany: any = {};

  for (const field of requiredStringFields) {
    const value = field === 'name' ? company.name || company.company : company[field];
    if (typeof value === 'string' && value.trim()) {
      if (field === 'name') {
        validatedCompany.company = value.trim();
      } else {
        validatedCompany[field] = value.trim();
      }
    } else {
      errors.push(`Invalid or missing ${field}`);
    }
  }

  // Validate financials
  if (!company.financials || typeof company.financials !== 'object') {
    errors.push('Invalid or missing financials data');
  } else {
    // Validate YOY data
    const yoyValidation = validateYOYData(company.financials.YOY);
    if (!yoyValidation.isValid) {
      errors.push(...yoyValidation.errors.map(err => `YOY: ${err}`));
    } else {
      validatedCompany.financials = { YOY: yoyValidation.data };
    }

    // Validate quarters data
    const quartersValidation = validateQuarterData(company.financials.quarters || {});
    if (!quartersValidation.isValid) {
      errors.push(...quartersValidation.errors);
    } else {
      if (validatedCompany.financials) {
        validatedCompany.financials.quarters = quartersValidation.data;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    data: validatedCompany,
    errors
  };
}

/**
 * Detect JSON input format and validate
 */
export function detectAndValidateJSONFormat(jsonData: any): ValidationResult<CompanyJSONInput> {
  const errors: string[] = [];

  if (!jsonData || typeof jsonData !== 'object') {
    return { isValid: false, errors: ['Invalid JSON data structure'] };
  }

  // Check for single company format
  if (jsonData.company) {
    const companyValidation = validateCompanyData(jsonData.company);
    if (companyValidation.isValid && companyValidation.data) {
      const companyData = companyValidation.data;
      return {
        isValid: true,
        data: { 
          company: {
            name: companyData.company,
            price: companyData.price,
            market_cap: companyData.market_cap,
            PE_ratio: companyData.PE_ratio,
            financials: companyData.financials
          }
        } as SingleCompanyJSONFormat,
        errors: []
      };
    } else {
      errors.push(...companyValidation.errors.map(err => `Company: ${err}`));
    }
  }

  // Check for multiple companies format
  if (jsonData.companies && Array.isArray(jsonData.companies)) {
    const validatedCompanies: MultipleCompaniesJSONFormat['companies'] = [];
    let hasErrors = false;

    for (let i = 0; i < jsonData.companies.length; i++) {
      const companyValidation = validateCompanyData(jsonData.companies[i]);
      if (companyValidation.isValid && companyValidation.data) {
        const companyData = companyValidation.data;
        validatedCompanies.push({
          name: companyData.company,
          price: companyData.price,
          market_cap: companyData.market_cap,
          PE_ratio: companyData.PE_ratio,
          financials: companyData.financials
        });
      } else {
        hasErrors = true;
        errors.push(...companyValidation.errors.map(err => `Company ${i + 1}: ${err}`));
      }
    }

    if (!hasErrors && validatedCompanies.length > 0) {
      return {
        isValid: true,
        data: { companies: validatedCompanies } as MultipleCompaniesJSONFormat,
        errors: []
      };
    }
  }

  if (errors.length === 0) {
    errors.push('JSON data must contain either "company" object or "companies" array');
  }

  return { isValid: false, errors };
}

/**
 * Normalize company data from any valid JSON format to internal CompanyFinancials format
 */
export function normalizeCompanyData(jsonInput: CompanyJSONInput): CompanyFinancials[] {
  const now = new Date();
  const companies: CompanyFinancials[] = [];

  if ('company' in jsonInput) {
    // Single company format
    const company = jsonInput.company;
    companies.push({
      id: generateId(),
      company: company.name,
      price: company.price,
      market_cap: company.market_cap,
      PE_ratio: company.PE_ratio,
      financials: company.financials,
      createdAt: now,
      updatedAt: now
    });
  } else if ('companies' in jsonInput) {
    // Multiple companies format
    for (const company of jsonInput.companies) {
      companies.push({
        id: generateId(),
        company: company.name,
        price: company.price,
        market_cap: company.market_cap,
        PE_ratio: company.PE_ratio,
        financials: company.financials,
        createdAt: now,
        updatedAt: now
      });
    }
  }

  return companies;
}

/**
 * Safely serialize data to JSON with error handling
 */
export function safeSerialize(data: any): string {
  try {
    return JSON.stringify(data, (_key, value) => {
      // Handle Date objects
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });
  } catch (error) {
    throw new DataError(`Failed to serialize data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Safely deserialize JSON data with error handling
 */
export function safeDeserialize<T>(jsonString: string): T {
  try {
    return JSON.parse(jsonString, (_key, value) => {
      // Handle Date strings
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return new Date(value);
      }
      return value;
    });
  } catch (error) {
    throw new DataError(`Failed to deserialize data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate localStorage availability and quota
 */
export function validateLocalStorageAvailability(): ValidationResult<boolean> {
  const errors: string[] = [];

  if (typeof window === 'undefined') {
    errors.push('localStorage is not available in server-side environment');
    return { isValid: false, errors };
  }

  if (!window.localStorage) {
    errors.push('localStorage is not supported in this browser');
    return { isValid: false, errors };
  }

  // Test localStorage functionality
  try {
    const testKey = '__localStorage_test__';
    const testValue = 'test';
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);

    if (retrieved !== testValue) {
      errors.push('localStorage is not functioning correctly');
    }
  } catch (error) {
    errors.push(`localStorage test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    isValid: errors.length === 0,
    data: true,
    errors
  };
}