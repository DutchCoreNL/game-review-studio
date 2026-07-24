import { describe, it, expect } from 'vitest';
import { orgAllySupport } from './organization';

describe('orgAllySupport', () => {
  it('is zero with no allies', () => {
    expect(orgAllySupport([])).toBe(0);
  });

  it('lends a quarter of the allies combined strength, floored', () => {
    expect(orgAllySupport([100])).toBe(25);
    expect(orgAllySupport([100, 60])).toBe(40); // 160 * 0.25
    expect(orgAllySupport([50, 50, 50])).toBe(37); // 150 * 0.25 = 37.5 -> 37
  });

  it('ignores fractional remainders below a full point', () => {
    expect(orgAllySupport([1])).toBe(0); // 0.25 -> 0
    expect(orgAllySupport([3])).toBe(0); // 0.75 -> 0
    expect(orgAllySupport([4])).toBe(1); // 1.0 -> 1
  });
});
