import { describe, it, expect } from 'vitest';
import { makeJob, type TargetKind } from './score';
import { stageFor, resolveKind as resolveKindForTest } from '@/components/game/score/JobTarget';
import type { DistrictId } from './types';

const DISTRICTS: DistrictId[] = ['low', 'port', 'iron', 'neon', 'crown'] as DistrictId[];
const KINDS: TargetKind[] = ['container', 'safe', 'crate', 'case', 'door', 'bag'];

describe('makeJob', () => {
  it('always names something physical to break into', () => {
    // The scene draws this. A job without a target would render an empty plinth.
    for (const d of DISTRICTS) {
      for (let i = 0; i < 40; i++) {
        expect(KINDS).toContain(makeJob(d, 0).target);
      }
    }
  });

  it('scales the work needed with the district and with your streak', () => {
    expect(makeJob('crown' as DistrictId, 0).required)
      .toBeGreaterThan(makeJob('low' as DistrictId, 0).required);
    expect(makeJob('port' as DistrictId, 8).required)
      .toBeGreaterThan(makeJob('port' as DistrictId, 0).required);
  });

  it('starts at zero progress', () => {
    expect(makeJob('low' as DistrictId, 0).progress).toBe(0);
  });
});

describe('stageFor', () => {
  it('walks the object through four visible states', () => {
    expect(stageFor(0)).toBe(0);
    expect(stageFor(29)).toBe(0);
    expect(stageFor(30)).toBe(1);
    expect(stageFor(65)).toBe(1);
    expect(stageFor(66)).toBe(2);
    expect(stageFor(98)).toBe(2);
    expect(stageFor(99)).toBe(3);
    expect(stageFor(100)).toBe(3);
  });

  it('never reports "open" before there is real progress', () => {
    // The point of the stages is that the picture cannot lie about how far in you are:
    // a container standing wide open at 10% would read as a bug.
    for (let p = 0; p < 30; p++) expect(stageFor(p)).toBe(0);
  });
});

describe('a job with no target', () => {
  it('still draws something', () => {
    // Saves made before targets existed have no kind on their active job. The scene used
    // to render a contact shadow with nothing standing on it.
    expect(resolveKindForTest(undefined)).toBe('crate');
    expect(resolveKindForTest('nonsense' as TargetKind)).toBe('crate');
    expect(resolveKindForTest('safe')).toBe('safe');
  });
});
