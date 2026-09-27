/**
 * Web Arena Shooter - Enemy Configurations
 * Member 3: Enemies + Gameplay
 *
 * Defines canonical configurations for the 3 required enemy types:
 * - Basic: Balanced health, speed, and damage
 * - Fast: Low health, high speed, lower damage
 * - Tank: High health, low speed, high damage
 */

export const ENEMY_CONFIGS = {
  basic: {
    type: 'basic',
    health: 50,
    maxHealth: 50,
    speed: 120,
    damage: 10,
    radius: 16,
    scoreValue: 100,
    attackCooldown: 1.0, // seconds between contact hits
    assets: {
      idle: 'enemy_basic_idle.png',
      walk1: 'enemy_basic_walk_1.png',
      walk2: 'enemy_basic_walk_2.png',
    },
    fallbackColor: '#e74c3c', // Red
  },
  fast: {
    type: 'fast',
    health: 25,
    maxHealth: 25,
    speed: 210,
    damage: 5,
    radius: 12,
    scoreValue: 150,
    attackCooldown: 0.75,
    assets: {
      idle: 'enemy_fast_idle.png',
      walk1: 'enemy_fast_walk_1.png',
      walk2: 'enemy_fast_walk_2.png',
    },
    fallbackColor: '#f39c12', // Orange/Yellow
  },
  tank: {
    type: 'tank',
    health: 160,
    maxHealth: 160,
    speed: 60,
    damage: 25,
    radius: 24,
    scoreValue: 300,
    attackCooldown: 1.5,
    assets: {
      idle: 'enemy_tank_idle.png',
      walk1: 'enemy_tank_walk_1.png',
      walk2: 'enemy_tank_walk_2.png',
    },
    fallbackColor: '#8e44ad', // Purple
  },
};

/**
 * Returns a cloned configuration object for the given enemy type.
 * @param {'basic'|'fast'|'tank'} type
 * @returns {object} Enemy configuration
 */
export function getEnemyConfig(type) {
  const config = ENEMY_CONFIGS[type];
  if (!config) {
    throw new Error(`Unknown enemy type: "${type}". Expected basic, fast, or tank.`);
  }
  return { ...config };
}
