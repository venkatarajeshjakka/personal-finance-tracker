import { NSECompany, MatchResult } from '@/types';

export class CompanyNameMatcher {
  /**
   * Find the best matching NSE company for a given company name
   */
  static findBestMatch(inputName: string, nseCompanies: NSECompany[]): MatchResult {
    if (!inputName || !inputName.trim()) {
      return {
        match: null,
        confidence: 0,
        suggestions: []
      };
    }

    const normalizedInput = this.normalizeCompanyName(inputName);
    let bestMatch: NSECompany | null = null;
    let bestScore = 0;
    const suggestions: Array<{ company: NSECompany; score: number }> = [];

    for (const company of nseCompanies) {
      const normalizedCompanyName = this.normalizeCompanyName(company.companyName);
      const score = this.calculateSimilarity(normalizedInput, normalizedCompanyName);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = company;
      }

      if (score > 0.3) { // Threshold for suggestions
        suggestions.push({ company, score });
      }
    }

    // Sort suggestions by score
    suggestions.sort((a, b) => b.score - a.score);

    return {
      match: bestScore > 0.7 ? bestMatch : null, // High confidence threshold
      confidence: bestScore,
      suggestions: suggestions.slice(0, 5).map(s => s.company) // Top 5 suggestions
    };
  }

  /**
   * Calculate similarity between two company names using multiple algorithms
   */
  static calculateSimilarity(name1: string, name2: string): number {
    if (name1 === name2) return 1.0;

    // Exact match after normalization
    if (name1.toLowerCase() === name2.toLowerCase()) return 0.95;

    // Check if one contains the other
    const lower1 = name1.toLowerCase();
    const lower2 = name2.toLowerCase();
    
    if (lower1.includes(lower2) || lower2.includes(lower1)) {
      const longer = lower1.length > lower2.length ? lower1 : lower2;
      const shorter = lower1.length <= lower2.length ? lower1 : lower2;
      return shorter.length / longer.length * 0.9;
    }

    // Levenshtein distance
    const levenshteinScore = 1 - (this.levenshteinDistance(lower1, lower2) / Math.max(lower1.length, lower2.length));
    
    // Jaccard similarity (word-based)
    const jaccardScore = this.jaccardSimilarity(lower1, lower2);
    
    // Token-based similarity
    const tokenScore = this.tokenSimilarity(lower1, lower2);

    // Weighted combination
    return (levenshteinScore * 0.4 + jaccardScore * 0.3 + tokenScore * 0.3);
  }

  /**
   * Normalize company name for better matching
   */
  static normalizeCompanyName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\b(ltd|limited|inc|incorporated|corp|corporation|co|company|pvt|private)\b/gi, '') // Remove common suffixes
      .replace(/\s+/g, ' ') // Clean up spaces again
      .trim()
      .toLowerCase();
  }

  /**
   * Get suggestions for company name correction
   */
  static suggestCorrections(inputName: string, nseCompanies: NSECompany[]): NSECompany[] {
    const result = this.findBestMatch(inputName, nseCompanies);
    return result.suggestions;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate Jaccard similarity between two strings (word-based)
   */
  private static jaccardSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 2));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Calculate token-based similarity
   */
  private static tokenSimilarity(str1: string, str2: string): number {
    const tokens1 = str1.split(/\s+/).filter(t => t.length > 1);
    const tokens2 = str2.split(/\s+/).filter(t => t.length > 1);

    if (tokens1.length === 0 && tokens2.length === 0) return 1;
    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    let matches = 0;
    const used = new Set<number>();

    for (const token1 of tokens1) {
      for (let i = 0; i < tokens2.length; i++) {
        if (used.has(i)) continue;
        
        const token2 = tokens2[i];
        if (token1 === token2 || 
            token1.includes(token2) || 
            token2.includes(token1) ||
            this.levenshteinDistance(token1, token2) <= 1) {
          matches++;
          used.add(i);
          break;
        }
      }
    }

    return matches / Math.max(tokens1.length, tokens2.length);
  }

  /**
   * Validate and correct company name using NSE company list
   */
  static validateAndCorrectCompanyName(companyName: string, nseCompanies: NSECompany[]): { correctedName: string; symbol?: string; confidence: number } {
    const match = this.findBestMatch(companyName, nseCompanies);
    
    if (match.match && match.confidence > 0.7) {
      return {
        correctedName: match.match.companyName,
        symbol: match.match.symbol,
        confidence: match.confidence
      };
    }

    return {
      correctedName: companyName,
      confidence: 0
    };
  }
}