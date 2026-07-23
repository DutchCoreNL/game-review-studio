import { describe, it, expect } from 'vitest';
import { JOBS, getJobDef, getJobSalary } from './jobs';

describe('jobs model', () => {
  it('has well-formed job defs', () => {
    expect(JOBS.length).toBeGreaterThan(0);
    for (const j of JOBS) {
      expect(j.id).toBeTruthy();
      expect(j.salary).toBeGreaterThan(0);
      expect(j.reqLevel).toBeGreaterThanOrEqual(1);
    }
  });

  it('scales salary with promotion (+20% per level)', () => {
    const job = getJobDef('barman')!;
    expect(getJobSalary(job, 0)).toBe(job.salary);
    expect(getJobSalary(job, 1)).toBe(Math.floor(job.salary * 1.2));
    expect(getJobSalary(job, 5)).toBe(Math.floor(job.salary * 2.0));
  });

  it('resolves job defs by id and returns undefined for unknown', () => {
    expect(getJobDef('advocaat')?.name).toBe('Advocaat');
    expect(getJobDef('nonexistent')).toBeUndefined();
    expect(getJobDef(null)).toBeUndefined();
  });
});
