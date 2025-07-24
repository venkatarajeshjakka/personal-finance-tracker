import { describe, it, expect } from 'vitest';

describe('Test Setup', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have localStorage mock', () => {
    expect(window.localStorage).toBeDefined();
    expect(typeof window.localStorage.getItem).toBe('function');
  });
});