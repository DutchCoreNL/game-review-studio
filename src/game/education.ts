// Education / Courses system — passive long-term training

export interface Course {
  id: string;
  name: string;
  description: string;
  durationMinutes: number; // real-time minutes
  perk: string; // human-readable perk description
  perkKey: string; // machine key for bonuses
  perkValue: number; // bonus percentage (e.g. 15 = +15%)
  reqLevel: number;
  icon: string;
  category: 'crime' | 'trade' | 'combat' | 'tech' | 'social';
}

export const COURSES: Course[] = [
  {
    id: 'street_smarts',
    name: 'Straatwijsheid',
    description: 'Leer de straten lezen en vergroot je kans op succesvolle operaties.',
    durationMinutes: 30,
    perk: '+5% crime succes',
    perkKey: 'crime_success',
    perkValue: 5,
    reqLevel: 1,
    icon: '🏙️',
    category: 'crime',
  },
  {
    id: 'forensic_chemistry',
    name: 'Forensische Chemie',
    description: 'Verbeter je kennis van drugsproductie voor hogere kwaliteit.',
    durationMinutes: 120,
    perk: '+15% drug kwaliteit',
    perkKey: 'drug_quality',
    perkValue: 15,
    reqLevel: 5,
    icon: '🧪',
    category: 'crime',
  },
  {
    id: 'financial_law',
    name: 'Financieel Recht',
    description: 'Leer geld effectiever witwassen met minder verlies.',
    durationMinutes: 180,
    perk: '-10% witwaskosten',
    perkKey: 'launder_cost',
    perkValue: 10,
    reqLevel: 8,
    icon: '⚖️',
    category: 'trade',
  },
  {
    id: 'weapons_training',
    name: 'Wapentraining',
    description: 'Intensieve schiettraining voor meer schade in gevechten.',
    durationMinutes: 240,
    perk: '+10% gevechtsschade',
    perkKey: 'combat_damage',
    perkValue: 10,
    reqLevel: 5,
    icon: '🎯',
    category: 'combat',
  },
  {
    id: 'cybersecurity',
    name: 'Cyberbeveiliging',
    description: 'Leer systemen kraken en vergroot je hacking succes.',
    durationMinutes: 150,
    perk: '+10% hacking succes',
    perkKey: 'hacking_success',
    perkValue: 10,
    reqLevel: 7,
    icon: '💻',
    category: 'tech',
  },
  {
    id: 'first_aid',
    name: 'Eerste Hulp',
    description: 'Versnel je herstel na ziekenhuisopnames.',
    durationMinutes: 60,
    perk: '-20% hersteltijd',
    perkKey: 'hospital_recovery',
    perkValue: 20,
    reqLevel: 3,
    icon: '🏥',
    category: 'social',
  },
  {
    id: 'negotiation',
    name: 'Onderhandelen',
    description: 'Slimmere deals sluiten voor meer handelswinst.',
    durationMinutes: 120,
    perk: '+10% handelswinst',
    perkKey: 'trade_profit',
    perkValue: 10,
    reqLevel: 4,
    icon: '🤝',
    category: 'trade',
  },
  {
    id: 'lockpicking',
    name: 'Lockpicking Masterclass',
    description: 'Vergroot je kans op succesvolle heists.',
    durationMinutes: 180,
    perk: '+15% heist succes',
    perkKey: 'heist_success',
    perkValue: 15,
    reqLevel: 10,
    icon: '🔐',
    category: 'crime',
  },
  {
    id: 'intimidation',
    name: 'Intimidatietechnieken',
    description: 'Leer vijanden sneller te breken in gevechten.',
    durationMinutes: 90,
    perk: '+8% PvP voordeel',
    perkKey: 'pvp_advantage',
    perkValue: 8,
    reqLevel: 6,
    icon: '😈',
    category: 'combat',
  },
  {
    id: 'smuggling_routes',
    name: 'Smokkelroutes',
    description: 'Leer geheime routes kennen voor minder douanerisico.',
    durationMinutes: 300,
    perk: '-25% smokkelrisico',
    perkKey: 'smuggle_risk',
    perkValue: 25,
    reqLevel: 12,
    icon: '🚢',
    category: 'trade',
  },
];

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}u ${m}m` : `${h}u`;
}

export function formatTimeRemaining(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Klaar!';
  const mins = Math.ceil(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}u ${m}m` : `${h}u`;
}
