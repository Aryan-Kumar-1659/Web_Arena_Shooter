/**
 * @file collision.js
 * @description Pure mathematical 2D collision detection and boundary clamping routines.
 * Owned by Member 1 (Team Lead + Core Engine + Player).
 */

/**
 * Calculate squared Euclidean distance between two 2D points.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number}
 */
export function distanceSq(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

/**
 * Calculate Euclidean distance between two 2D points.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number}
 */
export function distance(x1, y1, x2, y2) {
  return Math.sqrt(distanceSq(x1, y1, x2, y2));
}

/**
 * Check if two circular entities collide.
 * @param {{ x: number, y: number, radius: number }} c1
 * @param {{ x: number, y: number, radius: number }} c2
 * @returns {boolean} True if the circles overlap
 */
export function checkCircleCollision(c1, c2) {
  if (!c1 || !c2) return false;
  const radiusSum = (c1.radius ?? 0) + (c2.radius ?? 0);
  return distanceSq(c1.x, c1.y, c2.x, c2.y) < radiusSum * radiusSum;
}

/**
 * Check collision and return detailed overlap information.
 * @param {{ x: number, y: number, radius: number }} c1
 * @param {{ x: number, y: number, radius: number }} c2
 * @returns {{ collided: boolean, distance: number, overlap: number, nx: number, ny: number }}
 */
export function getCircleOverlap(c1, c2) {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const radiusSum = (c1.radius ?? 0) + (c2.radius ?? 0);

  if (dist < radiusSum) {
    const overlap = radiusSum - dist;
    const nx = dist === 0 ? 1 : dx / dist;
    const ny = dist === 0 ? 0 : dy / dist;
    return { collided: true, distance: dist, overlap, nx, ny };
  }

  return { collided: false, distance: dist, overlap: 0, nx: 0, ny: 0 };
}

/**
 * Check collision between a circle and an Axis-Aligned Bounding Box (AABB).
 * @param {{ x: number, y: number, radius: number }} circle
 * @param {{ x: number, y: number, width: number, height: number }} rect
 * @returns {boolean}
 */
export function checkCircleRectCollision(circle, rect) {
  if (!circle || !rect) return false;

  // Find closest point on rect to circle center
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

  const dSq = distanceSq(circle.x, circle.y, closestX, closestY);
  return dSq < (circle.radius ?? 0) * (circle.radius ?? 0);
}

/**
 * Checks if a point lies within a circular area.
 * @param {{ x: number, y: number }} point
 * @param {{ x: number, y: number, radius: number }} circle
 * @returns {boolean}
 */
export function isPointInCircle(point, circle) {
  if (!point || !circle) return false;
  return distanceSq(point.x, point.y, circle.x, circle.y) <= (circle.radius ?? 0) * (circle.radius ?? 0);
}

/**
 * Clamp entity coordinates inside rectangular arena boundaries.
 * @param {{ x: number, y: number, radius?: number }} entity
 * @param {{ x?: number, y?: number, width: number, height: number }} bounds
 * @param {number} [padding=0] Additional boundary margin
 * @returns {{ x: number, y: number }} Clamped coordinates
 */
export function clampEntityToBounds(entity, bounds, padding = 0) {
  const minX = (bounds.x ?? 0) + (entity.radius ?? 0) + padding;
  const minY = (bounds.y ?? 0) + (entity.radius ?? 0) + padding;
  const maxX = (bounds.x ?? 0) + bounds.width - (entity.radius ?? 0) - padding;
  const maxY = (bounds.y ?? 0) + bounds.height - (entity.radius ?? 0) - padding;

  entity.x = Math.max(minX, Math.min(entity.x, maxX));
  entity.y = Math.max(minY, Math.min(entity.y, maxY));

  return { x: entity.x, y: entity.y };
}
