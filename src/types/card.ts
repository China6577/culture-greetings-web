import type { CountryCode, Language } from '../themes/types'
export type CardMode = 'static' | 'h5'
export const animationEffects = [
  'petals',
  'stars',
  'confetti',
  'fireworks',
  'glow',
  'none',
] as const
export interface AnimationPlan {
  effect: (typeof animationEffects)[number]
  colors: string[]
  particle_count: number
  duration_seconds: number
  opacity: number
  particle_size: number
  wind: number
  region: 'artwork' | 'edges'
  image_motion: 'none' | 'drift' | 'breathe'
}
export interface GenerationDraft {
  prompt: string
  recipient: string
  sender: string
  custom_message: string
}
export interface GenerationSession {
  draft: GenerationDraft
  context: { country_code: CountryCode; locale: Language }
  composition_request_id: string
}
export interface Composition {
  id: string
  version: 3
  country_code: CountryCode
  locale: Language
  occasion: string
  recipient: string
  sender: string
  custom_message: string
  title: string
  mode: CardMode
  image_url: string
  image_model: 'agnes-image-2.5-flash'
  text_model: 'agnes-2.5-flash'
  visual: { paper: string; ink: string; accent: string; alignment: 'left' | 'center' }
  animation?: AnimationPlan | null
  created_at: string
}
export const agentRoles = [
  'planner',
  'culture',
  'copy',
  'designer',
  'motion',
  'reviewer',
  'artist',
  'delivery',
] as const
export type AgentRole = (typeof agentRoles)[number]
export interface GenerationJob {
  id: string
  status: 'queued' | 'running' | 'complete' | 'failed'
  events: { agent: AgentRole; status: 'running' | 'complete'; at: string }[]
  error_code: string | null
  card: Composition | null
}
