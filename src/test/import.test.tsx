import { describe, it, expect } from 'vitest';

describe('Import Format Validation', () => {
    // Mock validation function based on the import page logic
    const validateCompanyData = (parsed: any) => {
        let companies: any[] = [];

        if (parsed.financials && parsed.company && typeof parsed.company === 'string') {
            // Direct single company format: { "company": "Name", "financials": {...} }
            companies = [parsed];
        } else if (parsed.company && typeof parsed.company === 'object') {
            // Nested single company format: { "company": { ... } }
            companies = [parsed.company];
        } else if (parsed.companies && Array.isArray(parsed.companies)) {
            // Multiple companies format: { "companies": [...] }
            companies = parsed.companies;
        } else {
            throw new Error("Invalid JSON structure");
        }

        return companies.map((company, index) => {
            // Handle both 'name' field and 'company' field as string
            const companyName = company.name || (typeof company.company === 'string' ? company.company : null);

            if (!companyName) {
                throw new Error(`Company ${index + 1}: Missing 'name' or 'company' field`);
            }
            if (!company.financials?.quarters) {
                throw new Error(`Company ${index + 1}: Missing 'financials.quarters' data`);
            }

            return {
                company: companyName,
                price: company.price || "0",
                market_cap: company.market_cap || "0",
                PE_ratio: company.PE_ratio || "0",
                financials: company.financials
            };
        });
    };

    it('should validate direct company format', () => {
        const directFormat = {
            "company": "Persistent Sys",
            "price": "₹5,606",
            "market_cap": "₹87,665 Cr",
            "PE_ratio": "57.7",
            "financials": {
                "YOY": {
                    "sales_growth": "22%",
                    "EBIDT_growth": "34%",
                    "net_profit_growth": "39%",
                    "EPS_growth": "37%"
                },
                "quarters": {
                    "Jun 2025": {
                        "sales": 3334,
                        "EBIDT": 612,
                        "net_profit": 425,
                        "EPS": "₹27.17"
                    }
                }
            }
        };

        const result = validateCompanyData(directFormat);
        expect(result).toHaveLength(1);
        expect(result[0].company).toBe("Persistent Sys");
        expect(result[0].price).toBe("₹5,606");
        expect(result[0].financials.YOY.sales_growth).toBe("22%");
    });

    it('should validate the exact Persistent Sys schema', () => {
        const persistentSysSchema = {
            "company": "Persistent Sys",
            "price": "₹5,606",
            "market_cap": "₹87,665 Cr",
            "PE_ratio": "57.7",
            "financials": {
                "YOY": {
                    "sales_growth": "22%",
                    "EBIDT_growth": "34%",
                    "net_profit_growth": "39%",
                    "EPS_growth": "37%"
                },
                "quarters": {
                    "Jun 2025": {
                        "sales": 3334,
                        "EBIDT": 612,
                        "net_profit": 425,
                        "EPS": "₹27.17"
                    },
                    "Mar 2025": {
                        "sales": 3242,
                        "EBIDT": 584,
                        "net_profit": 396,
                        "EPS": "₹25.59"
                    },
                    "Jun 2024": {
                        "sales": 2737,
                        "EBIDT": 455,
                        "net_profit": 306,
                        "EPS": "₹19.89"
                    }
                }
            }
        };

        const result = validateCompanyData(persistentSysSchema);
        expect(result).toHaveLength(1);
        expect(result[0].company).toBe("Persistent Sys");
        expect(result[0].price).toBe("₹5,606");
        expect(result[0].market_cap).toBe("₹87,665 Cr");
        expect(result[0].PE_ratio).toBe("57.7");
        expect(result[0].financials.YOY.sales_growth).toBe("22%");
        expect(result[0].financials.quarters["Jun 2025"].sales).toBe(3334);
    });

    it('should validate nested company format', () => {
        const nestedFormat = {
            "company": {
                "name": "Test Company",
                "price": "100.50",
                "market_cap": "10000000000",
                "PE_ratio": "15.5",
                "financials": {
                    "YOY": {
                        "sales_growth": "12.5%",
                        "EBIDT_growth": "8.3%",
                        "net_profit_growth": "15.2%",
                        "EPS_growth": "10.1%"
                    },
                    "quarters": {
                        "Q4 2023": {
                            "sales": 5000000000,
                            "EBIDT": 1000000000,
                            "net_profit": 500000000,
                            "EPS": "25.50"
                        }
                    }
                }
            }
        };

        const result = validateCompanyData(nestedFormat);
        expect(result).toHaveLength(1);
        expect(result[0].company).toBe("Test Company");
        expect(result[0].price).toBe("100.50");
    });

    it('should validate multiple companies format', () => {
        const multipleFormat = {
            "companies": [
                {
                    "name": "Company A",
                    "price": "100.50",
                    "market_cap": "10000000000",
                    "PE_ratio": "15.5",
                    "financials": {
                        "YOY": {
                            "sales_growth": "12.5%",
                            "EBIDT_growth": "8.3%",
                            "net_profit_growth": "15.2%",
                            "EPS_growth": "10.1%"
                        },
                        "quarters": {
                            "Q4 2023": {
                                "sales": 5000000000,
                                "EBIDT": 1000000000,
                                "net_profit": 500000000,
                                "EPS": "25.50"
                            }
                        }
                    }
                },
                {
                    "name": "Company B",
                    "price": "200.75",
                    "market_cap": "20000000000",
                    "PE_ratio": "18.2",
                    "financials": {
                        "YOY": {
                            "sales_growth": "15.3%",
                            "EBIDT_growth": "12.1%",
                            "net_profit_growth": "18.7%",
                            "EPS_growth": "16.4%"
                        },
                        "quarters": {
                            "Q4 2023": {
                                "sales": 7500000000,
                                "EBIDT": 1500000000,
                                "net_profit": 750000000,
                                "EPS": "35.25"
                            }
                        }
                    }
                }
            ]
        };

        const result = validateCompanyData(multipleFormat);
        expect(result).toHaveLength(2);
        expect(result[0].company).toBe("Company A");
        expect(result[1].company).toBe("Company B");
    });

    it('should throw error for invalid format', () => {
        const invalidFormat = {
            "invalid": "data"
        };

        expect(() => validateCompanyData(invalidFormat)).toThrow("Invalid JSON structure");
    });

    it('should throw error for missing company name', () => {
        const missingNameFormat = {
            "company": {
                "price": "100.50",
                "financials": {
                    "quarters": {
                        "Q4 2023": {
                            "sales": 5000000000
                        }
                    }
                }
            }
        };

        expect(() => validateCompanyData(missingNameFormat)).toThrow("Missing 'name' or 'company' field");
    });

    it('should throw error for missing financials', () => {
        const missingFinancialsFormat = {
            "company": "Test Company",
            "price": "100.50"
        };

        expect(() => validateCompanyData(missingFinancialsFormat)).toThrow("Missing 'financials.quarters' data");
    });
});