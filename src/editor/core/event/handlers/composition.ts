import { CanvasEvent } from '../CanvasEvent'
import { input, removeComposingInput } from './input'

function compositionstart(host: CanvasEvent) {
  host.isComposing = true
}

function compositionend(host: CanvasEvent, evt: CompositionEvent) {
  host.isComposing = false
  removeComposingInput(host)
  const draw = host.getDraw()
  const cursor = draw.getCursor()
  // 合成结果不存在(输入框关闭)，无法触发input事件需手动触发渲染
  if (!evt.data) {
    const agentText = cursor.getAgentDomValue()
    if (agentText) {
      input(agentText, host)
    } else {
      const rangeManager = draw.getRange()
      const { endIndex: curIndex } = rangeManager.getRange()
      draw.render({
        curIndex
      })
    }
  }
  // 移除代理输入框数据
  cursor.clearAgentDomValue()
}

export default {
  compositionstart,
  compositionend
}