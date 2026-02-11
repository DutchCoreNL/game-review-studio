// Vehicle images
import carToyohata from './car-toyohata.jpg';
import carForgedyer from './car-forgedyer.jpg';
import carBavamotor from './car-bavamotor.jpg';
import carMeridiolux from './car-meridiolux.jpg';
import carLupoghini from './car-lupoghini.jpg';
import carRoyaleryce from './car-royaleryce.jpg';

// Trade goods images
import goodDrugs from './good-drugs.jpg';
import goodWeapons from './good-weapons.jpg';
import goodTech from './good-tech.jpg';
import goodLuxury from './good-luxury.jpg';
import goodMeds from './good-meds.jpg';

// Gear images
import gearGlock from './gear-glock.jpg';
import gearAk47 from './gear-ak47.jpg';
import gearVest from './gear-vest.jpg';
import gearSuit from './gear-suit.jpg';
import gearPhone from './gear-phone.jpg';
import gearLaptop from './gear-laptop.jpg';
import gearCartelBlade from './gear-cartel-blade.jpg';
import gearImplant from './gear-implant.jpg';
import gearSkullArmor from './gear-skull-armor.jpg';

export const VEHICLE_IMAGES: Record<string, string> = {
  toyohata: carToyohata,
  forgedyer: carForgedyer,
  bavamotor: carBavamotor,
  meridiolux: carMeridiolux,
  lupoghini: carLupoghini,
  royaleryce: carRoyaleryce,
};

export const GOOD_IMAGES: Record<string, string> = {
  drugs: goodDrugs,
  weapons: goodWeapons,
  tech: goodTech,
  luxury: goodLuxury,
  meds: goodMeds,
};

export const GEAR_IMAGES: Record<string, string> = {
  glock: gearGlock,
  ak47: gearAk47,
  vest: gearVest,
  suit: gearSuit,
  phone: gearPhone,
  laptop: gearLaptop,
  cartel_blade: gearCartelBlade,
  lotus_implant: gearImplant,
  skull_armor: gearSkullArmor,
};
