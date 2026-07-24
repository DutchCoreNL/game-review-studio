import { describe, it, expect } from 'vitest';
import { resolveSkillEffect, COMBAT_SKILLS } from '../combatSkills';

const fixed = (v: number) => () => v;
const skill = (id: string) => COMBAT_SKILLS.find(s => s.id === id)!;
const stats = { muscle: 5, brains: 4, charm: 6 };

describe('resolveSkillEffect', () => {
  it('a damage skill deals attack damage', () => {
    // snelle_slag: value 8 -> floor(5*2 + 8 + 0) = 18
    const out = resolveSkillEffect(skill('snelle_slag'), stats, 100, 100, fixed(0));
    expect(out.isAttack).toBe(true);
    expect(out.damage).toBe(18);
    expect(out.enemyStun).toBe(false);
  });

  it('a heal_and_buff skill heals and grants a self buff, without attacking', () => {
    // adrenaline_rush: heal 15 + damage_boost buff
    const out = resolveSkillEffect(skill('adrenaline_rush'), stats, 100, 100);
    expect(out.isAttack).toBe(false);
    expect(out.selfHeal).toBe(15);
    expect(out.selfBuffs.map(b => b.id)).toContain('damage_boost');
  });

  it('a stun skill stuns the enemy on a successful roll', () => {
    // intimidatie: chance 0.8 + charm*0.02 -> low roll succeeds
    const out = resolveSkillEffect(skill('intimidatie'), stats, 100, 100, fixed(0));
    expect(out.enemyStun).toBe(true);
    expect(out.damage).toBe(Math.floor(3 + stats.charm));
  });

  it('an execute skill hits harder against a low-HP target', () => {
    const strong = resolveSkillEffect(skill('executie'), stats, 10, 100, fixed(0)); // 10% HP -> execute
    const weak = resolveSkillEffect(skill('executie'), stats, 90, 100, fixed(0));   // 90% HP -> no bonus
    expect(strong.damage).toBeGreaterThan(weak.damage);
  });
});
