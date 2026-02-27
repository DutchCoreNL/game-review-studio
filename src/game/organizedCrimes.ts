// Organized Crimes — gang-wide async heists

export type OCRole = 'lookout' | 'driver' | 'hacker' | 'muscle';

export interface OrganizedCrime {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  minMembers: number;
  roles: { role: OCRole; label: string; icon: string; statKey: string }[];
  basePayout: number;
  repReward: number;
  xpReward: number;
  reqGangLevel: number;
  difficulty: 'medium' | 'hard' | 'extreme';
}

export const OC_ROLES: Record<OCRole, { label: string; icon: string; statKey: string }> = {
  lookout: { label: 'Uitkijk', icon: '👁️', statKey: 'brains' },
  driver: { label: 'Chauffeur', icon: '🚗', statKey: 'charm' },
  hacker: { label: 'Hacker', icon: '💻', statKey: 'brains' },
  muscle: { label: 'Spierkracht', icon: '💪', statKey: 'muscle' },
};

export const ORGANIZED_CRIMES: OrganizedCrime[] = [
  {
    id: 'bank_heist',
    name: 'Bankoverval',
    description: 'Coördineer een professionele bankoverval. Vereist precieze timing en een goed team.',
    durationMinutes: 120,
    minMembers: 4,
    roles: [
      { role: 'lookout', ...OC_ROLES.lookout },
      { role: 'driver', ...OC_ROLES.driver },
      { role: 'hacker', ...OC_ROLES.hacker },
      { role: 'muscle', ...OC_ROLES.muscle },
    ],
    basePayout: 50000,
    repReward: 200,
    xpReward: 500,
    reqGangLevel: 2,
    difficulty: 'medium',
  },
  {
    id: 'casino_raid',
    name: 'Casino Raid',
    description: 'Val het beveiligde casino in Crown District binnen en steel de kluisinhoud.',
    durationMinutes: 180,
    minMembers: 4,
    roles: [
      { role: 'lookout', ...OC_ROLES.lookout },
      { role: 'driver', ...OC_ROLES.driver },
      { role: 'hacker', ...OC_ROLES.hacker },
      { role: 'muscle', ...OC_ROLES.muscle },
    ],
    basePayout: 100000,
    repReward: 400,
    xpReward: 800,
    reqGangLevel: 4,
    difficulty: 'hard',
  },
  {
    id: 'weapons_convoy',
    name: 'Wapenkonvooi',
    description: 'Onderschep een militair wapenkonvooi op de snelweg. Extreem gevaarlijk.',
    durationMinutes: 240,
    minMembers: 4,
    roles: [
      { role: 'lookout', ...OC_ROLES.lookout },
      { role: 'driver', ...OC_ROLES.driver },
      { role: 'hacker', ...OC_ROLES.hacker },
      { role: 'muscle', ...OC_ROLES.muscle },
    ],
    basePayout: 200000,
    repReward: 600,
    xpReward: 1200,
    reqGangLevel: 6,
    difficulty: 'extreme',
  },
  {
    id: 'drug_shipment',
    name: 'Drugssmokkel',
    description: 'Smokkel een grote lading cocaïne de haven in. Hoge winst, hoog risico.',
    durationMinutes: 150,
    minMembers: 4,
    roles: [
      { role: 'lookout', ...OC_ROLES.lookout },
      { role: 'driver', ...OC_ROLES.driver },
      { role: 'hacker', ...OC_ROLES.hacker },
      { role: 'muscle', ...OC_ROLES.muscle },
    ],
    basePayout: 75000,
    repReward: 300,
    xpReward: 600,
    reqGangLevel: 3,
    difficulty: 'medium',
  },
  {
    id: 'data_heist',
    name: 'Data Diefstal',
    description: 'Breek in bij een tech-bedrijf en steel waardevolle bedrijfsgeheimen.',
    durationMinutes: 300,
    minMembers: 4,
    roles: [
      { role: 'lookout', ...OC_ROLES.lookout },
      { role: 'driver', ...OC_ROLES.driver },
      { role: 'hacker', ...OC_ROLES.hacker },
      { role: 'muscle', ...OC_ROLES.muscle },
    ],
    basePayout: 150000,
    repReward: 500,
    xpReward: 1000,
    reqGangLevel: 5,
    difficulty: 'hard',
  },
];

export function calculateOCSuccess(signups: Record<string, { role: OCRole; username: string; level: number }>): {
  success: boolean;
  successRate: number;
  multiplier: number;
} {
  const members = Object.values(signups);
  const avgLevel = members.reduce((s, m) => s + m.level, 0) / members.length;
  const baseRate = Math.min(85, 40 + avgLevel * 3);
  const roleBonus = members.length >= 4 ? 10 : 0;
  const successRate = Math.min(95, baseRate + roleBonus);
  const success = Math.random() * 100 < successRate;
  const multiplier = success ? (1 + (avgLevel - 5) * 0.05) : 0;
  return { success, successRate, multiplier: Math.max(0.5, Math.min(2, multiplier)) };
}

export function formatOCDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}u ${m}m` : `${h}u`;
}

export function formatOCCountdown(target: string): string {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return 'Klaar!';
  const mins = Math.ceil(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}u ${m}m` : `${h}u`;
}
