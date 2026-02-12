// Audio settings panel for ProfileView
import { useState, useEffect } from 'react';
import { SectionHeader } from '../ui/SectionHeader';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Music, Zap, Wind } from 'lucide-react';
import { getVolume, setVolume, isMuted, toggleMute } from '@/game/sounds';
import { setMusicVolume } from '@/game/sounds/ambientMusic';
import { setAmbianceVolume } from '@/game/sounds/cityAmbiance';

interface AudioLayer {
  id: string;
  label: string;
  icon: React.ReactNode;
  getVol: () => number;
  setVol: (v: number) => void;
  defaultVol: number;
  max: number;
}

const STORAGE_KEY = 'noxhaven_audio_prefs';

function loadPrefs(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function savePrefs(prefs: Record<string, number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function AudioSettingsPanel() {
  const [muted, setMuted] = useState(isMuted());
  const [volumes, setVolumes] = useState<Record<string, number>>(() => {
    const saved = loadPrefs();
    return {
      master: saved.master ?? 0.35,
      music: saved.music ?? 0.08,
      sfx: saved.sfx ?? 0.35,
      ambiance: saved.ambiance ?? 0.06,
    };
  });

  // Apply saved volumes on mount
  useEffect(() => {
    setVolume(volumes.master);
    setMusicVolume(volumes.music);
    setAmbianceVolume(volumes.ambiance);
  }, []);

  const handleVolumeChange = (id: string, val: number) => {
    const newVols = { ...volumes, [id]: val };
    setVolumes(newVols);
    savePrefs(newVols);

    switch (id) {
      case 'master': setVolume(val); break;
      case 'music': setMusicVolume(val); break;
      case 'ambiance': setAmbianceVolume(val); break;
      // SFX uses master gain, stored for reference
    }
  };

  const handleToggleMute = () => {
    const newMuted = toggleMute();
    setMuted(newMuted);
  };

  const layers: { id: string; label: string; icon: React.ReactNode; max: number; step: number }[] = [
    { id: 'master', label: 'Master Volume', icon: <Volume2 size={14} />, max: 1, step: 0.05 },
    { id: 'music', label: 'Muziek', icon: <Music size={14} />, max: 0.2, step: 0.01 },
    { id: 'ambiance', label: 'Stadssfeer', icon: <Wind size={14} />, max: 0.15, step: 0.005 },
    { id: 'sfx', label: 'Geluidseffecten', icon: <Zap size={14} />, max: 1, step: 0.05 },
  ];

  return (
    <>
      <SectionHeader title="Audio Instellingen" icon={<Volume2 size={12} />} />
      <div className="game-card mb-4">
        {/* Mute toggle */}
        <button
          onClick={handleToggleMute}
          className={`w-full flex items-center justify-between p-2 rounded mb-3 transition-all ${
            muted ? 'bg-blood/10 border border-blood' : 'bg-muted border border-border'
          }`}
        >
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            {muted ? <VolumeX size={14} className="text-blood" /> : <Volume2 size={14} className="text-gold" />}
            {muted ? 'GELUID UIT' : 'GELUID AAN'}
          </span>
          <motion.div
            className={`w-8 h-4 rounded-full relative ${muted ? 'bg-blood/30' : 'bg-gold/30'}`}
          >
            <motion.div
              className={`w-3.5 h-3.5 rounded-full absolute top-0.5 ${muted ? 'bg-blood' : 'bg-gold'}`}
              animate={{ left: muted ? '2px' : '14px' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </motion.div>
        </button>

        {/* Volume sliders */}
        <div className={`space-y-3 ${muted ? 'opacity-30 pointer-events-none' : ''}`}>
          {layers.map(layer => {
            const pct = (volumes[layer.id] / layer.max) * 100;
            return (
              <div key={layer.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-wider">
                    {layer.icon}
                    {layer.label}
                  </span>
                  <span className="text-[0.5rem] text-gold font-bold">{Math.round(pct)}%</span>
                </div>
                <div className="relative h-5 flex items-center">
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-gold/60 to-gold rounded-full"
                        style={{ width: `${pct}%` }}
                        layout
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={layer.max}
                    step={layer.step}
                    value={volumes[layer.id]}
                    onChange={(e) => handleVolumeChange(layer.id, parseFloat(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                  {/* Thumb indicator */}
                  <motion.div
                    className="absolute w-3 h-3 rounded-full bg-gold border-2 border-card shadow-lg pointer-events-none"
                    style={{ left: `calc(${pct}% - 6px)` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
