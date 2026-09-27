

export const WEAPON_CONFIGS = {
  rifle: {
    id: 'rifle',
    ammo: 30,
    magazineSize: 30,
    cooldownMs: 150, // Fast automatic fire rate (~6.6 shots/sec)
    damage: 25,
    bulletSpeed: 700,
    bulletRadius: 4,
    pellets: 1,
    spreadAngle: 0.05, // Tight spread cone in radians (~2.8 degrees)
    reloadTimeMs: 1500,
    sprite: 'rifle.png',
    sound: 'rifle_fire.wav'
  },
  shotgun: {
    id: 'shotgun',
    ammo: 8,
    magazineSize: 8,
    cooldownMs: 800, // Slower pump action (~1.25 shots/sec)
    damage: 15, // Per pellet (5 pellets * 15 = 75 max damage)
    bulletSpeed: 550,
    bulletRadius: 3,
    pellets: 5,
    spreadAngle: 0.35, // Wide spread cone in radians (~20 degrees)
    reloadTimeMs: 2000,
    sprite: 'shotgun.png',
    sound: 'shotgun_fire.wav'
  }
};

/**
 * Returns a fresh WeaponState object strictly matching CONTRACT.md:
 * WeaponState { id: "rifle"|"shotgun", ammo, magazineSize, cooldownMs, damage }
 * 
 * @param {'rifle' | 'shotgun'} weaponId 
 * @returns {object} WeaponState
 */
export function createWeaponState(weaponId = 'rifle') {
  const config = WEAPON_CONFIGS[weaponId];
  if (!config) {
    throw new Error(`Unknown weaponId: "${weaponId}". Valid weapons are "rifle" or "shotgun".`);
  }

  return {
    id: config.id,
    ammo: config.ammo,
    magazineSize: config.magazineSize,
    cooldownMs: config.cooldownMs,
    damage: config.damage
  };
}

/**
 * Returns the full operational configuration for a given weapon.
 * 
 * @param {'rifle' | 'shotgun'} weaponId 
 * @returns {object}
 */
export function getWeaponConfig(weaponId = 'rifle') {
  const config = WEAPON_CONFIGS[weaponId];
  if (!config) {
    throw new Error(`Unknown weaponId: "${weaponId}". Valid weapons are "rifle" or "shotgun".`);
  }
  return { ...config };
}
