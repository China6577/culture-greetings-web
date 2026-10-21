import type { CSSProperties } from 'react'
import type { AnimationPlan } from '../types/card'
import { animationParticles } from '../features/card-animation/plan'

export function CardAnimation({ plan, cardId }: { plan: AnimationPlan; cardId: string }) {
  if (plan.effect === 'none') return null
  return (
    <div
      className="card-animation"
      data-effect={plan.effect}
      data-region={plan.region}
      aria-hidden="true"
    >
      {animationParticles(plan, cardId).map((particle, index) => (
        <span
          className="card-particle"
          key={index}
          style={
            {
              left: `${particle.left}%`,
              top: ['petals', 'confetti'].includes(plan.effect) ? '-20px' : `${particle.top}%`,
              '--particle-size': `${particle.size}px`,
              '--particle-duration': `${particle.duration}s`,
              '--particle-delay': `${particle.delay}s`,
              '--particle-color': particle.color,
              '--particle-wind': `${particle.drift}px`,
              '--particle-rotation': `${particle.rotation}deg`,
              '--particle-opacity': particle.opacity,
            } as CSSProperties
          }
        >
          {plan.effect === 'fireworks' && (
            <svg viewBox="0 0 100 100" focusable="false">
              {Array.from({ length: 12 }, (_, ray) => (
                <path key={ray} d="M50 17V4 M50 30V25" transform={`rotate(${ray * 30} 50 50)`} />
              ))}
              <circle cx="50" cy="50" r="2" />
            </svg>
          )}
        </span>
      ))}
    </div>
  )
}
