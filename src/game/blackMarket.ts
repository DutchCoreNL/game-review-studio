// ========== ZWARTE MARKT — PROCEDURELE SHOP MET ROULERENDE VOORRAAD ==========

import { generateWeapon, type GeneratedWeapon, type WeaponRarity } from './weaponGenerator';
import { generateGear, type GeneratedGear, type GearRarity, type GearType } from './gearGenerator';

export type BlackMarketItemType = 'weapon' | 'armor' | 'gadget';

export interface BlackMarketItem {
  id: string;
  type: BlackMarketItemType;
  weapon?: GeneratedWeapon;
  gear?: GeneratedGear;
  price: number;
  dirtyPrice: number; // 20% korting
  isFeatured: boolean;
  sold: boolean;
}

export interface BlackMarketStock {
  items: BlackMarketItem[];
  refreshDay: number; // game day when stock was generated
  nextRefreshDay: number; // game day when stock refreshes
}

/** Generate a fresh black market stock */
export function generateBlackMarketStock(playerLevel: number, currentDay: number): BlackMarketStock {
  const items: BlackMarketItem[] = [];
  const itemCount = 4 + Math.floor(Math.random() * 3); // 4-6 items

  for (let i = 0; i < itemCount; i++) {
    const isFeatured = i === 0; // first item is featured
    const roll = Math.random();
    const type: BlackMarketItemType = roll < 0.4 ? 'weapon' : roll < 0.7 ? 'armor' : 'gadget';

    if (type === 'weapon') {
      const forcedRarity = isFeatured ? rollFeaturedRarity() : undefined;
      const weapon = generateWeapon(playerLevel, forcedRarity);
      const price = Math.floor(weapon.sellValue * 2.5);
      items.push({
        id: `bm_${currentDay}_${i}`,
        type: 'weapon',
        weapon,
        price,
        dirtyPrice: Math.floor(price * 0.8),
        isFeatured,
        sold: false,
      });
    } else {
      const gearType: GearType = type === 'armor' ? 'armor' : 'gadget';
      const forcedRarity = isFeatured ? rollFeaturedRarity() as GearRarity : undefined;
      const gear = generateGear(playerLevel, gearType, forcedRarity);
      const price = Math.floor(gear.sellValue * 2.5);
      items.push({
        id: `bm_${currentDay}_${i}`,
        type,
        gear,
        price,
        dirtyPrice: Math.floor(price * 0.8),
        isFeatured,
        sold: false,
      });
    }
  }

  return {
    items,
    refreshDay: currentDay,
    nextRefreshDay: currentDay + 3,
  };
}

function rollFeaturedRarity(): WeaponRarity {
  const r = Math.random();
  if (r < 0.1) return 'legendary';
  if (r < 0.4) return 'epic';
  return 'rare';
}

/** Check if stock needs refresh */
export function shouldRefreshStock(stock: BlackMarketStock | null, currentDay: number): boolean {
  if (!stock) return true;
  return currentDay >= stock.nextRefreshDay;
}

/** Get display name for an item */
export function getBlackMarketItemName(item: BlackMarketItem): string {
  if (item.weapon) return item.weapon.name;
  if (item.gear) return item.gear.name;
  return 'Onbekend Item';
}

/** Get rarity of an item */
export function getBlackMarketItemRarity(item: BlackMarketItem): string {
  if (item.weapon) return item.weapon.rarity;
  if (item.gear) return item.gear.rarity;
  return 'common';
}
