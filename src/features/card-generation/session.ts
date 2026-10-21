import type { GenerationDraft, GenerationSession } from '../../types/card'
export const defaultGenerationDraft: GenerationDraft = {
  prompt: '',
  recipient: '',
  sender: '',
  custom_message: '',
}
let activeSession: GenerationSession | null = null
export function saveGenerationSession(session: GenerationSession) {
  activeSession = session
}
export function loadGenerationSession() {
  return activeSession
}
export function clearGenerationSession() {
  activeSession = null
}
export function clearLegacyDrafts() {
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = globalThis[name]
      const keys: string[] = []
      for (let index = 0; index < storage.length; index++) {
        const key = storage.key(index)
        if (
          key &&
          (key.startsWith('kinship:card:') ||
            ['kinship:draft', 'kinship:generation-draft', 'kinship:generation-session'].includes(
              key,
            ))
        )
          keys.push(key)
      }
      for (const key of keys) storage.removeItem(key)
    } catch {
      /* Blocked storage never prevents use; no draft is read or written. */
    }
  }
}
