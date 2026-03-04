// ========== ARSENAL ASSET MAPPING ==========

// Weapon frame images
import pistolImg from './weapons/pistol.png';
import smgImg from './weapons/smg.png';
import shotgunImg from './weapons/shotgun.png';
import rifleImg from './weapons/rifle.png';
import bladeImg from './weapons/blade.png';
import lmgImg from './weapons/lmg.png';
import launcherImg from './weapons/launcher.png';

// Armor frame images
import vestImg from './gear/vest.png';
import jacketImg from './gear/jacket.png';
import exosuitImg from './gear/exosuit.png';
import shieldImg from './gear/shield.png';
import cloakImg from './gear/cloak.png';

// Gadget frame images
import phoneImg from './gear/phone.png';
import deckImg from './gear/deck.png';
import implantImg from './gear/implant.png';
import droneImg from './gear/drone.png';
import scannerImg from './gear/scanner.png';

export const WEAPON_FRAME_IMAGES: Record<string, string> = {
  pistol: pistolImg,
  smg: smgImg,
  shotgun: shotgunImg,
  rifle: rifleImg,
  blade: bladeImg,
  lmg: lmgImg,
  launcher: launcherImg,
};

export const GEAR_FRAME_IMAGES: Record<string, string> = {
  vest: vestImg,
  jacket: jacketImg,
  exosuit: exosuitImg,
  shield: shieldImg,
  cloak: cloakImg,
  phone: phoneImg,
  deck: deckImg,
  implant: implantImg,
  drone: droneImg,
  scanner: scannerImg,
};
