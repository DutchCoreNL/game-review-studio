import { useState } from 'react';
import { CharacterAvatar, AvatarState } from './CharacterAvatar';
import { DistrictId } from '@/game/types';
import { DISTRICTS, GEAR } from '@/game/constants';
import { SectionHeader } from '../ui/SectionHeader';
import { Slider } from '@/components/ui/slider';
import { Eye } from 'lucide-react';

const WEAPONS = GEAR.filter(g => g.type === 'weapon');
const ARMORS = GEAR.filter(g => g.type === 'armor');
const DISTRICT_IDS: DistrictId[] = ['port', 'crown', 'iron', 'low', 'neon'];

export function AvatarPreviewDashboard() {
  const [preview, setPreview] = useState<AvatarState>({
    level: 1,
    karma: 0,
    district: 'low',
    weapon: null,
    armor: null,
    hasCybernetics: false,
  });

  return (
    <div>
      <SectionHeader title="Avatar Preview" icon={<Eye size={12} />} />
      <div className="game-card mb-4 flex flex-col items-center gap-4">
        <CharacterAvatar state={preview} size="lg" />

        <div className="w-full space-y-3 text-xs">
          {/* Level */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Level</span>
              <span className="font-bold text-gold">{preview.level}</span>
            </div>
            <Slider min={1} max={50} step={1} value={[preview.level]}
              onValueChange={([v]) => setPreview(p => ({ ...p, level: v }))} />
          </div>

          {/* Karma */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Karma</span>
              <span className={`font-bold ${preview.karma < -20 ? 'text-blood' : preview.karma > 20 ? 'text-ice' : 'text-foreground'}`}>
                {preview.karma}
              </span>
            </div>
            <Slider min={-100} max={100} step={1} value={[preview.karma]}
              onValueChange={([v]) => setPreview(p => ({ ...p, karma: v }))} />
          </div>

          {/* District */}
          <div>
            <span className="text-muted-foreground block mb-1">District</span>
            <div className="flex gap-1 flex-wrap">
              {DISTRICT_IDS.map(id => (
                <button key={id} onClick={() => setPreview(p => ({ ...p, district: id }))}
                  className={`px-2 py-1 rounded text-[0.55rem] font-bold uppercase ${
                    preview.district === id ? 'bg-gold/15 border border-gold text-gold' : 'bg-muted border border-border text-muted-foreground'
                  }`}>{DISTRICTS[id].name}</button>
              ))}
            </div>
          </div>

          {/* Weapon */}
          <div>
            <span className="text-muted-foreground block mb-1">Wapen</span>
            <select value={preview.weapon || ''} onChange={e => setPreview(p => ({ ...p, weapon: e.target.value || null }))}
              className="w-full bg-muted border border-border rounded px-2 py-1.5 text-xs text-foreground">
              <option value="">Geen</option>
              {WEAPONS.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          {/* Armor */}
          <div>
            <span className="text-muted-foreground block mb-1">Bepantsering</span>
            <select value={preview.armor || ''} onChange={e => setPreview(p => ({ ...p, armor: e.target.value || null }))}
              className="w-full bg-muted border border-border rounded px-2 py-1.5 text-xs text-foreground">
              <option value="">Geen</option>
              {ARMORS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Cybernetics */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={preview.hasCybernetics}
              onChange={e => setPreview(p => ({ ...p, hasCybernetics: e.target.checked }))}
              className="accent-[hsl(var(--ice))]" />
            <span className="text-muted-foreground">Neural Implant</span>
          </label>
        </div>
      </div>
    </div>
  );
}
