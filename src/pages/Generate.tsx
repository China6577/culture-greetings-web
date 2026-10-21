import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Circle, LoaderCircle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ApiError, fetchGeneration, startGeneration } from '../services/cardApi'
import { clearGenerationSession, loadGenerationSession } from '../features/card-generation/session'
import { agentRoles, type GenerationJob } from '../types/card'

function pollDelay(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const done = () => {
      signal.removeEventListener('abort', abort)
      resolve()
    }
    const timer = setTimeout(done, 1500)
    function abort() {
      clearTimeout(timer)
      reject(signal.reason)
    }
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) abort()
  })
}
export default function Generate() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const jobId = params.get('job')
  const [session] = useState(loadGenerationSession)
  const [job, setJob] = useState<GenerationJob | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => () => clearGenerationSession(), [])
  useEffect(() => {
    if (!jobId && !session) {
      navigate('/create', { replace: true })
      return
    }
    const controller = new AbortController()
    setError('')
    async function run() {
      try {
        if (!jobId) {
          const created = await startGeneration(session!, controller.signal)
          if (!controller.signal.aborted) navigate(`/generate?job=${created.id}`, { replace: true })
          return
        }
        while (!controller.signal.aborted) {
          const current = await fetchGeneration(jobId, controller.signal)
          if (controller.signal.aborted) return
          setJob(current)
          if (current.status === 'complete') {
            clearGenerationSession()
            navigate(`/card/${current.card!.id}`, {
              replace: true,
              state: { composition: current.card },
            })
            return
          }
          if (current.status === 'failed') {
            setError(current.error_code ?? 'generation_failed')
            return
          }
          await pollDelay(controller.signal)
        }
      } catch (failure) {
        if (!controller.signal.aborted)
          setError(failure instanceof ApiError ? failure.code : 'network_error')
      }
    }
    void run()
    return () => controller.abort()
  }, [jobId, session, navigate, attempt])
  function retry() {
    if (job?.status === 'failed' && session) {
      session.composition_request_id = crypto.randomUUID()
      setJob(null)
      navigate('/generate', { replace: true })
    } else setAttempt((value) => value + 1)
  }
  return (
    <div className="container generation-page">
      <div className="generation-shell panel">
        <p className="eyebrow">{t('ai.studio')}</p>
        <h1>{t('ai.generating')}</h1>
        <p className="agent-intro">
          {t(job?.status === 'queued' ? 'ai.queued' : 'ai.progressDescription')}
        </p>
        <ol className="generation-steps agent-steps" aria-live="polite">
          {agentRoles.map((role) => {
            const event = job?.events.filter((item) => item.agent === role).at(-1)
            return (
              <li key={role} className={event ? 'active' : ''}>
                {event?.status === 'complete' ? (
                  <Check size={21} />
                ) : event?.status === 'running' && !error ? (
                  <LoaderCircle size={21} className="spinner" />
                ) : (
                  <Circle size={21} />
                )}
                <span>{t(`ai.agent.${role}`)}</span>
                <small>
                  {t(
                    event?.status === 'complete'
                      ? 'ai.done'
                      : event?.status === 'running'
                        ? error
                          ? 'ai.stopped'
                          : 'ai.running'
                        : 'ai.waiting',
                  )}
                </small>
              </li>
            )
          })}
        </ol>
        {error && (
          <div className="request-error" role="alert">
            <p>{t(`ai.error.${error}`, { defaultValue: t('ai.error.generation_failed') })}</p>
            {session || job?.status !== 'failed' ? (
              <button className="button button-outline" onClick={retry}>
                <RefreshCw size={15} />
                {t(job?.status === 'failed' ? 'ai.retryGeneration' : 'p2.retry')}
              </button>
            ) : (
              <Link className="button button-outline" to="/create">
                {t('navCreate')}
              </Link>
            )}
          </div>
        )}
        <Link to="/cards" className="text-link">
          {t('ai.leaveGeneration')}
        </Link>
      </div>
    </div>
  )
}
