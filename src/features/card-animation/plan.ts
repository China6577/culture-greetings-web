import { animationEffects, type AnimationPlan } from '../../types/card'

export function isAnimationPlan(value: unknown): value is AnimationPlan {
  if (!value || typeof value !== 'object') return false
  const plan = value as AnimationPlan
  const bounded = (n: unknown, min: number, max: number) =>
    typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max
  return (
    animationEffects.includes(plan.effect) &&
    Array.isArray(plan.colors) &&
    plan.colors.length >= 1 &&
    plan.colors.length <= 3 &&
    plan.colors.every((color) => typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color)) &&
    Number.isInteger(plan.particle_count) &&
    (plan.effect === 'none' ? plan.particle_count === 0 : bounded(plan.particle_count, 4, 24)) &&
    bounded(plan.duration_seconds, 6, 20) &&
    bounded(plan.opacity, 0.12, 0.55) &&
    bounded(plan.particle_size, 4, 16) &&
    bounded(plan.wind, -1, 1) &&
    ['artwork', 'edges'].includes(plan.region) &&
    ['none', 'drift', 'breathe'].includes(plan.image_motion)
  )
}

// Positions are stable for a saved card; re-renders never reshuffle or restart its artwork.
export function animationParticles(plan: AnimationPlan, cardId: string) {
  if (plan.effect === 'none') return []
  let seed = [...cardId].reduce(
    (value, char) => Math.imul(value ^ char.charCodeAt(0), 16777619),
    2166136261,
  )
  const random = () => {
    seed ^= seed << 13
    seed ^= seed >>> 17
    seed ^= seed << 5
    return (seed >>> 0) / 4294967296
  }
  return Array.from({ length: plan.particle_count }, (_, index) => {
    const left =
      plan.region === 'edges'
        ? index % 2 === 0
          ? 3 + random() * 8
          : 89 + random() * 8
        : 8 + random() * 84
    const duration = plan.duration_seconds * (0.85 + random() * 0.3)
    return {
      left,
      top: 8 + random() * 76,
      size: plan.particle_size * (0.65 + random() * 0.55),
      duration,
      delay: -(index / plan.particle_count + random() * 0.15) * duration,
      color: plan.colors[index % plan.colors.length],
      drift: plan.wind * 35 + (random() - 0.5) * 18,
      rotation: random() * 360,
      opacity: plan.opacity * (0.7 + random() * 0.3),
    }
  })
}
