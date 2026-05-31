import { Draw } from '../draw/Draw'
import { I18n } from '../i18n/I18n'
import { EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { ZERO } from '../../dataset/constant/Common'
import { IRange } from '../../interface/Range'

// 屏幕阅读器播报管理器
// 通过 aria-live 区域向辅助技术播报编辑器状态变更
export class Accessibility {
  private draw: Draw
  private i18n: I18n
  private disabled: boolean
  private assertiveDom: HTMLDivElement | null = null
  private rangeChangeHandler: ((payload: IRange) => void) | null = null

  constructor(draw: Draw) {
    this.draw = draw
    this.i18n = draw.getI18n()
    this.disabled = draw.getOptions().accessibility.disabled

    if (this.disabled) return

    // 创建对屏幕阅读器可见、对普通用户隐藏的 aria-live 容器
    const wrapper = document.createElement('div')
    wrapper.className = `${EDITOR_PREFIX}-sr-only`

    this.assertiveDom = document.createElement('div')
    this.assertiveDom.setAttribute('aria-live', 'assertive')
    this.assertiveDom.setAttribute('aria-atomic', 'true')

    wrapper.appendChild(this.assertiveDom)
    draw.getContainer().appendChild(wrapper)

    // 监听选区变化，自动播报选中文本
    this.rangeChangeHandler = this.handleRangeChange.bind(this)
    const eventBus = this.draw.getEventBus()
    eventBus.on('rangeChange', this.rangeChangeHandler)
  }

  private handleRangeChange(range: IRange): void {
    if (range.startIndex === range.endIndex) return
    this.selection()
  }

  // 播报选区文本
  public selection(): void {
    if (this.disabled) return
    const text = this.draw.getRange().toString()
    if (!text.trim()) return
    const prefix = this.i18n.t('accessibility.selected')
    this.assertive(`${prefix}${text}`)
  }

  // 播报输入内容
  public input(data: string): void {
    if (this.disabled) return
    const text = data.replace(new RegExp(ZERO, 'g'), '').replace(/\n/g, '')
    if (!text.trim()) return
    const prefix = this.i18n.t('accessibility.input')
    this.assertive(`${prefix}${text}`)
  }

  // assertive 模式播报（立即打断当前朗读）
  public assertive(message: string): void {
    if (this.disabled || !this.assertiveDom) return
    this.assertiveDom.textContent = ''
    void this.assertiveDom.offsetHeight
    this.assertiveDom.textContent = message
  }

  public destroy(): void {
    if (this.disabled) return
    if (this.rangeChangeHandler) {
      const eventBus = this.draw.getEventBus()
      eventBus.off('rangeChange', this.rangeChangeHandler)
    }
    this.assertiveDom?.parentElement?.remove()
  }
}
