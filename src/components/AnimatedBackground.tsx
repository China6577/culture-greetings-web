import { useReducedMotion } from 'framer-motion'
import { useCulture } from './ThemeProvider'
export function AnimatedBackground({ kind }: { kind?: string }) {
  const { currentTheme, motion } = useCulture()
  const reduced = useReducedMotion()
  const ambient = kind ?? currentTheme.animation.ambient
  if (!motion || reduced) return null
  return (
    <div className={`ambient ambient-${ambient}`} aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${8 + i * 10}%`,
            animationDelay: `${i * -1.7}s`,
            animationDuration: `${9 + (i % 4) * 2}s`,
            top: `${(i * 17) % 80}%`,
          }}
        />
      ))}
    </div>
  )
}
