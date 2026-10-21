import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { animationParticles, isAnimationPlan } from './plan'
import { CardAnimation } from '../../components/CardAnimation'
import type { AnimationPlan } from '../../types/card'

const plan: AnimationPlan = {
  effect: 'petals',
  colors: ['#DAC3D1', '#EADABA'],
  particle_count: 10,
  duration_seconds: 12,
  opacity: 0.3,
  particle_size: 10,
  wind: 0.2,
  region: 'artwork',
  image_motion: 'none',
}
describe('AI animation contracts', () => {
  it('rejects executable values, unbounded motion and unknown rendering primitives', () => {
    expect(isAnimationPlan(plan)).toBe(true)
    for (const changes of [
      { effect: '<script>' },
      { colors: ['url(https://example.com/a)'] },
      { colors: [] },
      { particle_count: 999 },
      { particle_count: 1.5 },
      { duration_seconds: 0 },
      { opacity: 1 },
      { wind: Infinity },
      { particle_size: -1 },
      { region: 'message' },
      { image_motion: 'javascript' },
    ])
      expect(isAnimationPlan({ ...plan, ...changes })).toBe(false)
  })
  it('keeps saved-card placement stable and limits edge effects to the margins', () => {
    const particles = animationParticles({ ...plan, region: 'edges' }, 'saved-card')
    expect(particles).toEqual(animationParticles({ ...plan, region: 'edges' }, 'saved-card'))
    expect(particles).toHaveLength(10)
    expect(particles.every((p) => p.left <= 11 || p.left >= 89)).toBe(true)
    expect(particles).not.toEqual(animationParticles({ ...plan, region: 'edges' }, 'other-card'))
    expect(
      animationParticles({ ...plan, effect: 'none', particle_count: 0 }, 'saved-card'),
    ).toEqual([])
  })
  it('renders distinct accessible decoration for each effect and nothing for none', () => {
    for (const effect of ['petals', 'stars', 'confetti', 'fireworks', 'glow'] as const) {
      const html = renderToStaticMarkup(
        createElement(CardAnimation, { plan: { ...plan, effect }, cardId: 'saved-card' }),
      )
      expect(html).toContain(`data-effect="${effect}"`)
      expect(html).toContain('aria-hidden="true"')
      expect(html.includes('<svg')).toBe(effect === 'fireworks')
    }
    expect(
      renderToStaticMarkup(
        createElement(CardAnimation, {
          plan: { ...plan, effect: 'none', particle_count: 0 },
          cardId: 'saved-card',
        }),
      ),
    ).toBe('')
  })
})
