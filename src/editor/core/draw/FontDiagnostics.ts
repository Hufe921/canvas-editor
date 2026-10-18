import type {
  FontCoverageLocation,
  FontCoverageReport
} from '../../interface/FontCoverage'
import type { I18n } from '../i18n/I18n'

/** Instance chrome only: never participates in document layout or persistence. */
export class FontDiagnostics {
  private root = document.createElement('aside')
  private status = document.createElement('div')
  private details = document.createElement('details')
  private summary = document.createElement('summary')
  private list = document.createElement('ul')
  private report: FontCoverageReport | null = null
  private warned = new Set<string>()
  private hadIssues = false
  private destroyed = false

  constructor(
    container: HTMLElement,
    private i18n: I18n,
    private presentation: () => { print: boolean; rtl: boolean },
    private locate?: (location: FontCoverageLocation) => void
  ) {
    this.root.className = 'ce-font-diagnostics'
    this.root.hidden = true
    this.status.setAttribute('role', 'status')
    this.status.setAttribute('aria-live', 'polite')
    this.status.setAttribute('aria-atomic', 'true')
    this.details.append(this.summary, this.list)
    this.root.append(this.status, this.details)
    container.append(this.root)
  }

  update(report: FontCoverageReport) {
    if (this.destroyed) return
    this.report = structuredClone(report)
    const current = new Set<string>()
    for (const issue of report.issues) {
      if (issue.downloadStatus === 'loading' || issue.downloadStatus === 'idle')
        continue
      // Counts, source positions, revisions and locale cannot cause log storms.
      const key = JSON.stringify([
        issue.script,
        issue.requestedFamily,
        issue.requestedWeight,
        issue.requestedStyle,
        issue.reason,
        issue.downloadStatus,
        [...issue.missingCharacters].sort(),
        [...issue.missingSequences].sort()
      ])
      current.add(key)
      if (this.warned.has(key)) continue
      console.warn(
        issue.reason === 'unsupportedGlyphFormat'
          ? '[canvas-editor] Unsupported glyph format: use a supported outline font.'
          : '[canvas-editor] Font coverage: install a font package covering these characters/styles.',
        {
          script: issue.script,
          reason: issue.reason,
          status: issue.downloadStatus,
          weight: issue.requestedWeight,
          style: issue.requestedStyle,
          uniqueCount: issue.uniqueCount,
          samples: issue.samples.slice(0, 16),
          codePoints: issue.codePoints.slice(0, 32)
        }
      )
    }
    this.warned = current
    this.refresh()
  }

  refresh() {
    if (this.destroyed || !this.report) return
    const { print, rtl } = this.presentation()
    const issues = this.report.issues
    const t = (key: string) => this.i18n.t(`fontCoverage.${key}`)
    this.root.dir = rtl ? 'rtl' : 'ltr'
    this.root.lang =
      this.i18n.getLocale() === 'zhCN' ? 'zh-CN' : this.i18n.getLocale()
    this.root.hidden = print || (!issues.length && !this.hadIssues)
    this.root.setAttribute('aria-label', t('details'))
    this.summary.textContent = t('details')
    this.details.hidden = !issues.length
    const stateKey = (issue: FontCoverageReport['issues'][number]) => {
      if (issue.reason === 'unsupportedGlyphFormat') return 'format'
      if (issue.downloadStatus === 'disabled') return 'manual'
      if (issue.downloadStatus === 'idle') return 'loading'
      return issue.downloadStatus
    }
    const message = issues.length
      ? [...new Set(issues.map(issue => t(stateKey(issue))))].join(' ')
      : t('resolved')
    // Do not reannounce unchanged status on every document revision.
    if (this.status.textContent !== message) this.status.textContent = message
    this.list.replaceChildren()
    for (const issue of issues) {
      const item = document.createElement('li')
      const category = this.i18n.t(issue.categoryLabel) || issue.script
      const guidance =
        issue.reason === 'unsupportedGlyphFormat' ? t('format') : ''
      const state = stateKey(issue)
      item.textContent =
        `${category}: ${issue.uniqueCount} ${t('characters')}; ` +
        `${t(state)}; ${t(`reason.${issue.reason}`)}; ${guidance} ` +
        `${t('style')}: ${issue.requestedWeight ?? 400}/${issue.requestedStyle ?? 'normal'}; ` +
        `${t('samples')}: ${issue.samples.slice(0, 16).join('、')}; ` +
        `${t('codePoints')}: ${issue.codePoints.slice(0, 32).join(' ')}${
          issue.codePoints.length > 32 ? ' …' : ''
        }`
      const location = issue.locations.find(item => item.end > item.start)
      if (this.locate && location) {
        const button = document.createElement('button')
        button.type = 'button'
        button.textContent = t('locate')
        button.addEventListener('click', () => this.locate?.(location))
        item.append(' ', button)
      }
      this.list.append(item)
    }
    if (issues.length) this.hadIssues = true
  }

  destroy() {
    this.destroyed = true
    this.report = null
    this.warned.clear()
    this.root.remove()
  }
}
