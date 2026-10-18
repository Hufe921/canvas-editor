import type {
  FontCoverageIssue,
  FontCoverageReport,
  FontDownloadAttempt,
  FontDownloadStatus,
  FontFailureStage
} from '../../../interface/FontCoverage'
import type {
  FontRegistrationResult,
  IEditorFontFace
} from '../../../interface/TextEngine'
import { BunnyFontProvider } from './bunny/BunnyFontProvider'
import { sharedFontResources } from './bunny/FontResourceStore'

interface State {
  key: string
  status: FontDownloadStatus
  controller: AbortController
  attempts: FontDownloadAttempt[]
  failure?: { stage?: FontFailureStage; message: string }
  urls: Set<string>
  timer?: ReturnType<typeof setTimeout>
}
interface Host {
  register(
    faces: IEditorFontFace[],
    signal: AbortSignal
  ): Promise<FontRegistrationResult[]>
  change(): void
}

/** Per-document subscriptions; transport/cache are shared, issue state is not. */
export class FontDownloadManager {
  private states = new Map<string, State>()
  private issueKeys = new Map<string, string>()
  private enabled = false
  private destroyed = false
  private completed = new Map<string, number>()

  constructor(
    private host: Host,
    private provider = new BunnyFontProvider()
  ) {}

  private key(issue: FontCoverageIssue, contexts: string[]) {
    return JSON.stringify([
      issue.requestedFamily,
      issue.requestedWeight,
      issue.requestedStyle,
      issue.script,
      issue.reason === 'missingStyle' ? 'style' : 'coverage',
      [...new Set(contexts)].sort(),
      issue.missingCharacters,
      issue.missingSequences
    ])
  }

  sync(
    report: FontCoverageReport,
    getContexts: (id: string) => string[],
    active: boolean
  ) {
    if (this.destroyed) return
    this.enabled = active && report.autoDownloadFonts
    const next = new Set<string>()
    this.issueKeys.clear()
    if (this.enabled)
      for (const issue of report.issues) {
        const contexts = getContexts(issue.id)
        const key = this.key(issue, contexts)
        this.issueKeys.set(issue.id, key)
        next.add(key)
        if (!this.states.has(key)) {
          const state: State = {
            key,
            status: 'loading',
            controller: new AbortController(),
            attempts: [],
            urls: new Set()
          }
          this.states.set(key, state)
          state.timer = setTimeout(() => {
            state.timer = undefined
            void this.run(state, structuredClone(issue), contexts).catch(
              error => {
                if (this.current(state)) {
                  state.status = 'failed'
                  state.failure = { message: String(error) }
                  this.host.change()
                }
              }
            )
          }, 80)
        }
      }
    for (const [key, state] of this.states)
      if (!next.has(key)) {
        clearTimeout(state.timer)
        state.controller.abort()
        this.states.delete(key)
      }
  }

  private current(state: State) {
    return (
      !this.destroyed &&
      this.enabled &&
      this.states.get(state.key) === state &&
      !state.controller.signal.aborted
    )
  }

  private async run(
    state: State,
    issue: FontCoverageIssue,
    contexts: string[]
  ) {
    if (!this.current(state)) return
    const signal = state.controller.signal
    const plan = await this.provider.plan(issue, { contexts, signal })
    if (!this.current(state)) return
    if (plan.status !== 'ready') {
      if (plan.url) state.urls.add(plan.url)
      state.status = plan.status === 'unsupported' ? 'unsupported' : 'failed'
      state.failure =
        plan.status === 'failed'
          ? { stage: plan.stage, message: plan.message }
          : { message: `Unsupported ${plan.reason}` }
      this.host.change()
      return
    }
    state.urls.add(plan.metadata.url)
    const faces: IEditorFontFace[] = []
    const loadedIds: string[] = []
    for (const resource of plan.resources) {
      if (!this.current(state)) return
      state.urls.add(resource.url)
      const attempt: FontDownloadAttempt = {
        provider: 'bunny',
        family: resource.family,
        weight: resource.weight,
        style: resource.style,
        resourceId: resource.resourceId,
        status: 'loading'
      }
      state.attempts.push(attempt)
      this.host.change()
      if ((this.completed.get(resource.resourceId) || 0) > Date.now()) {
        attempt.status = 'resolved'
        continue
      }
      // Another issue in this editor may need the same face; shared transport
      // and FontManager coalesce it. No issue is allowed a repeated round.
      const result = await this.provider.download(resource, signal)
      if (!this.current(state)) return
      if (result.status === 'failed') {
        attempt.status = 'failed'
        attempt.failureStage = result.stage
        attempt.failureReason = result.message
        state.failure = { stage: result.stage, message: result.message }
      } else {
        attempt.status = 'resolved'
        faces.push(result.face)
        loadedIds.push(resource.resourceId)
      }
    }
    if (faces.length && this.current(state)) {
      const results = await this.host.register(faces, signal)
      if (!this.current(state)) return
      results.forEach((result, index) => {
        if (result.status !== 'failed') return
        const attempt = state.attempts.find(
          item => item.resourceId === loadedIds[index]
        )
        if (attempt) {
          attempt.status = 'failed'
          attempt.failureStage = 'register'
          attempt.failureReason = result.failure.message
        }
      })
      if (results.some(result => result.status === 'failed'))
        state.failure = {
          stage: 'register',
          message: 'Automatic font registration failed'
        }
      else
        for (const id of loadedIds) {
          this.completed.set(id, Date.now() + 86400000)
          if (this.completed.size > 256)
            this.completed.delete(this.completed.keys().next().value!)
        }
    }
    if (!this.current(state)) return
    // If coverage succeeded the issue/state was removed by the host re-scan.
    // A successful download is not evidence that the remaining text is covered.
    state.status = 'failed'
    state.failure ??= {
      message:
        'Downloaded basic fonts do not cover the remaining characters or style'
    }
    this.host.change()
  }

  decorate(report: FontCoverageReport): FontCoverageReport {
    for (const issue of report.issues) {
      if (!report.autoDownloadFonts) {
        issue.downloadStatus = 'disabled'
        issue.attemptedDownloads = []
        delete issue.downloadFailure
        continue
      }
      const key = this.issueKeys.get(issue.id)
      const state = key ? this.states.get(key) : undefined
      if (state) {
        issue.downloadStatus = state.status
        issue.attemptedDownloads = structuredClone(state.attempts)
        issue.downloadFailure = state.failure ? { ...state.failure } : undefined
      }
    }
    return report
  }

  retry() {
    if (this.destroyed) return
    for (const state of this.states.values()) {
      state.urls.forEach(url => sharedFontResources.invalidate(url))
      clearTimeout(state.timer)
      state.controller.abort()
    }
    sharedFontResources.clearFailures()
    this.states.clear()
    this.completed.clear()
    this.host.change()
  }

  destroy() {
    this.destroyed = true
    for (const state of this.states.values()) {
      clearTimeout(state.timer)
      state.controller.abort()
    }
    this.states.clear()
    this.issueKeys.clear()
    this.completed.clear()
  }
}
