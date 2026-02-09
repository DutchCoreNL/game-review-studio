import { DistrictId } from './types';

export interface DistrictEvent {
  id: string;
  district: DistrictId;
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
  minHeat: number;
  effect: string;
}

export const DISTRICT_EVENTS: DistrictEvent[] = [
  // === PORT NERO — haven, smokkel, zee ===
  { id: 'port_cargo_tip', district: 'port', title: 'Verloren Lading', description: 'Een container is "per ongeluk" van het schip gevallen. Gratis goederen!', type: 'positive', minHeat: 0, effect: 'port_free_goods' },
  { id: 'port_customs_raid', district: 'port', title: 'Douane Razzia', description: 'De douane controleert alle schepen. Je smokkellading wordt onderschept.', type: 'negative', minHeat: 25, effect: 'port_lose_smuggle' },
  { id: 'port_fog_cover', district: 'port', title: 'Dichte Mist in de Haven', description: 'De mist biedt perfecte dekking. Smokkelroutes zijn vandaag veiliger.', type: 'positive', minHeat: 0, effect: 'port_heat_reduction' },
  { id: 'port_dock_strike', district: 'port', title: 'Havenstaking', description: 'Havenarbeiders staken. Alle handel via de haven ligt stil.', type: 'neutral', minHeat: 0, effect: 'port_price_spike' },
  { id: 'port_ship_wreck', district: 'port', title: 'Schipbreuk bij de Kade', description: 'Een smokkelboot is gezonken. Waardevolle lading spoelt aan.', type: 'positive', minHeat: 0, effect: 'port_bonus_money' },

  // === CROWN HEIGHTS — financieel, hightech, elite ===
  { id: 'crown_insider_trade', district: 'crown', title: 'Insider Trading Tip', description: 'Een bankier fluistert je een tip toe. De markt beweegt in je voordeel.', type: 'positive', minHeat: 0, effect: 'crown_trade_bonus' },
  { id: 'crown_sec_investigation', district: 'crown', title: 'SEC Onderzoek', description: 'De financiële autoriteiten onderzoeken verdachte transacties in het district.', type: 'negative', minHeat: 20, effect: 'crown_money_freeze' },
  { id: 'crown_charity_gala', district: 'crown', title: 'Liefdadigheidsgala', description: 'Een exclusief gala. Perfecte plek om contacten te leggen en je reputatie op te vijzelen.', type: 'positive', minHeat: 0, effect: 'crown_rep_boost' },
  { id: 'crown_data_breach', district: 'crown', title: 'Data Breach', description: 'Een groot bedrijf is gehackt. Zwarte data is tijdelijk meer waard.', type: 'neutral', minHeat: 0, effect: 'crown_tech_spike' },
  { id: 'crown_penthouse_robbery', district: 'crown', title: 'Penthouse Inbraak', description: 'Iemand heeft een penthouse leeggerooofd. De politie is extra alert.', type: 'negative', minHeat: 15, effect: 'crown_heat_spike' },

  // === IRON BOROUGH — industrie, wapens, ruw ===
  { id: 'iron_arms_deal', district: 'iron', title: 'Illegale Wapendeal', description: 'Een wapenhandelaar biedt overtollige voorraad aan tegen dumpprijzen.', type: 'positive', minHeat: 0, effect: 'iron_cheap_weapons' },
  { id: 'iron_factory_explosion', district: 'iron', title: 'Fabrieksbrand', description: 'Een illegaal lab is ontploft. Chemicaliën liggen voor het oprapen.', type: 'neutral', minHeat: 0, effect: 'iron_free_chemicals' },
  { id: 'iron_gang_war', district: 'iron', title: 'Bendeoorlog in de Fabrieken', description: 'Twee gangs vechten om terrein. Je crew raakt gewond in het kruisvuur.', type: 'negative', minHeat: 10, effect: 'iron_crew_damage' },
  { id: 'iron_scrapyard_find', district: 'iron', title: 'Sloopplaats Vondst', description: 'In de sloopplaats vind je bruikbare onderdelen voor je voertuig.', type: 'positive', minHeat: 0, effect: 'iron_vehicle_repair' },
  { id: 'iron_union_protection', district: 'iron', title: 'Vakbondsbescherming', description: 'De vakbond biedt je crew bescherming aan. Iedereen herstelt.', type: 'positive', minHeat: 0, effect: 'iron_crew_heal' },

  // === LOWRISE — straat, armoede, overleven ===
  { id: 'low_street_hustle', district: 'low', title: 'Straathandel', description: 'Lokale dealers bieden je een snelle deal aan. Klein maar zeker geld.', type: 'positive', minHeat: 0, effect: 'low_quick_cash' },
  { id: 'low_mugging', district: 'low', title: 'Straatroof', description: 'Je wordt beroofd in een donker steegje. Je verliest wat cash.', type: 'negative', minHeat: 0, effect: 'low_lose_cash' },
  { id: 'low_snitch', district: 'low', title: 'Verklikker', description: 'Een buurtbewoner heeft je aangegeven bij de politie.', type: 'negative', minHeat: 10, effect: 'low_heat_increase' },
  { id: 'low_stash_found', district: 'low', title: 'Verborgen Voorraad', description: 'Achter een losse muur vind je een vergeten stash drugs.', type: 'positive', minHeat: 0, effect: 'low_free_drugs' },
  { id: 'low_community_help', district: 'low', title: 'Buurtsteun', description: 'De buurt beschermt je tegen de politie. Je heat daalt.', type: 'positive', minHeat: 15, effect: 'low_community_cover' },

  // === NEON STRIP — nachtleven, gokken, luxe ===
  { id: 'neon_vip_invite', district: 'neon', title: 'VIP Uitnodiging', description: 'Een mysterieuze host nodigt je uit voor een privé pokertoernooi. Groot geld.', type: 'positive', minHeat: 0, effect: 'neon_bonus_money' },
  { id: 'neon_drug_bust', district: 'neon', title: 'Club Inval', description: 'De narcotica-brigade doet een inval in de clubs. Drugs worden in beslag genomen.', type: 'negative', minHeat: 30, effect: 'neon_lose_drugs' },
  { id: 'neon_celebrity_sighting', district: 'neon', title: 'Celebrity Spotted', description: 'Een beroemdheid wordt gezien in jouw club. Je reputatie stijgt.', type: 'positive', minHeat: 0, effect: 'neon_rep_boost' },
  { id: 'neon_counterfeit_chips', district: 'neon', title: 'Valse Fiches', description: 'Iemand probeert valse casinofiches te gebruiken. Het casino compenseert je.', type: 'positive', minHeat: 0, effect: 'neon_casino_bonus' },
  { id: 'neon_power_outage', district: 'neon', title: 'Stroomuitval op de Strip', description: 'De neonlichten vallen uit. In de chaos verdwijnen er goederen.', type: 'negative', minHeat: 0, effect: 'neon_chaos_loss' },
];
