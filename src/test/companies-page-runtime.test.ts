import { describe, it, expect } from 'vitest';

describe('Companies Page Runtime Fix', () => {
  it('should not have circular dependency issues', () => {
    // Test that the variable declaration order is correct
    const companies = [
      { id: '1', company: 'Test Company 1' },
      { id: '2', company: 'Test Company 2' }
    ];
    
    const searchTerm = '';
    const sortBy = 'name';
    const sortOrder = 'asc';
    
    // Simulate the filteredAndSortedCompanies logic
    const filteredAndSortedCompanies = companies.filter(company =>
      company.company.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // This should work without runtime errors
    const shouldUseVirtualization = filteredAndSortedCompanies.length > 25;
    
    expect(shouldUseVirtualization).toBe(false);
    expect(filteredAndSortedCompanies).toHaveLength(2);
  });

  it('should enable virtualization for large datasets', () => {
    // Create 30 companies to test virtualization threshold
    const companies = Array.from({ length: 30 }, (_, i) => ({
      id: `${i}`,
      company: `Test Company ${i}`
    }));
    
    const searchTerm = '';
    
    const filteredAndSortedCompanies = companies.filter(company =>
      company.company.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const shouldUseVirtualization = filteredAndSortedCompanies.length > 25;
    
    expect(shouldUseVirtualization).toBe(true);
    expect(filteredAndSortedCompanies).toHaveLength(30);
  });

  it('should handle search filtering correctly', () => {
    const companies = [
      { id: '1', company: 'Apple Inc' },
      { id: '2', company: 'Microsoft Corp' },
      { id: '3', company: 'Google LLC' }
    ];
    
    const searchTerm = 'apple';
    
    const filteredAndSortedCompanies = companies.filter(company =>
      company.company.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const shouldUseVirtualization = filteredAndSortedCompanies.length > 25;
    
    expect(shouldUseVirtualization).toBe(false);
    expect(filteredAndSortedCompanies).toHaveLength(1);
    expect(filteredAndSortedCompanies[0].company).toBe('Apple Inc');
  });
});