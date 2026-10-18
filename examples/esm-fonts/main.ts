import Editor, {
  EditorRuntimeError,
  type FontCoverageReport,
  type FontRegistrationResult,
  type IEditorOption,
  type IUpdateOption
} from '@herberthe/canvas-editor'

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id)
  if (!node) throw new Error(`Missing element: ${id}`)
  return node as T
}
const automatic = element<HTMLInputElement>('automatic')
const actions = element<HTMLFieldSetElement>('actions')
const status = element<HTMLParagraphElement>('status')
const coverage = element<HTMLPreElement>('coverage')
const registration = element<HTMLParagraphElement>('registration')
const fileInput = element<HTMLInputElement>('font-file')

// Omit autoDownloadFonts to use the default true. The optional query is useful
// for opening the same example in an offline configuration from the outset.
const options: IEditorOption = {
  defaultFont: 'Noto Naskh Arabic',
  width: 720,
  height: 560,
  margins: [40, 40, 40, 40],
  header: { disabled: true },
  footer: { disabled: true },
  pageNumber: { disabled: true }
}
if (new URLSearchParams(location.search).get('auto') === 'false') {
  options.autoDownloadFonts = false
  automatic.checked = false
}
const editor = new Editor(
  element<HTMLDivElement>('editor'),
  [{ value: 'مرحبا بالعالم' }],
  options
)
function showCoverage(report: FontCoverageReport) {
  coverage.dataset.issueCount = String(report.issues.length)
  coverage.textContent = report.issues.length
    ? report.issues
        .map(
          issue =>
            `${issue.script}: ${issue.downloadStatus} (${issue.reason})\n` +
            `样例: ${issue.samples.join(' ')}\n` +
            `所需样式: ${issue.requestedWeight ?? 400} ${issue.requestedStyle ?? 'normal'}`
        )
        .join('\n\n')
    : '当前内容已被注册字体覆盖。'
}
// Subscribe before ready so early transitions are observed; also query a
// current snapshot after ready instead of relying on receiving an initial event.
editor.eventBus.on('fontCoverageChange', showCoverage)
window.addEventListener('pagehide', () => editor.destroy(), { once: true })

automatic.addEventListener('change', () => {
  const update: IUpdateOption = { autoDownloadFonts: automatic.checked }
  editor.command.executeUpdateOptions(update)
  showCoverage(editor.getFontCoverageReport())
})
element<HTMLButtonElement>('retry').addEventListener('click', () => {
  editor.retryFontDownloads()
})
function showRegistration(results: FontRegistrationResult[]) {
  registration.textContent = results
    .map(result =>
      result.status === 'failed'
        ? `字体注册失败: ${result.failure.stage} — ${result.failure.message}`
        : `字体注册结果: ${result.status} — ${result.face.family}`
    )
    .join('\n')
  showCoverage(editor.getFontCoverageReport())
}
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0]
  if (!file) return
  const family = element<HTMLInputElement>('family').value.trim()
  const weight = element<HTMLInputElement>('weight').valueAsNumber
  const style =
    element<HTMLSelectElement>('font-style').value === 'italic'
      ? 'italic'
      : 'normal'
  if (!family || !Number.isFinite(weight) || weight < 1 || weight > 1000) {
    registration.textContent = '请填写字体家族和 1–1000 之间的字重。'
    return
  }
  fileInput.disabled = true
  try {
    showRegistration(
      await editor.register.fonts([
        {
          family,
          weight,
          style,
          data: await file.arrayBuffer()
        }
      ])
    )
  } catch (error) {
    registration.textContent = `补字体失败: ${String(error)}`
  } finally {
    fileInput.disabled = false
    fileInput.value = ''
  }
})
try {
  await editor.ready
  actions.disabled = false
  status.dataset.state = editor.state
  status.textContent = '编辑器已就绪；后台字体下载单独显示在覆盖报告中。'
  showCoverage(editor.getFontCoverageReport())
} catch (error) {
  status.dataset.state = 'failed'
  status.textContent =
    error instanceof EditorRuntimeError
      ? `初始化失败: ${error.code} — ${error.message}`
      : `初始化失败: ${String(error)}`
  editor.destroy()
}
