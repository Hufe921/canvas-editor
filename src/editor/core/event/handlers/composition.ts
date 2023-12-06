import { CanvasEvent } from '../CanvasEvent'
import { input, removeComposingInput } from './input'

function compositionstart(host: CanvasEvent) {
  host.isComposing = true
}

function compositionend(host: CanvasEvent, evt: CompositionEvent) {
  host.isComposing = false
  // 处理输入框关闭
  const draw = host.getDraw()
  // 不存在值：删除合成输入
  if (!evt.data) {
    removeComposingInput(host)
    const rangeManager = draw.getRange()
    const { endIndex: curIndex } = rangeManager.getRange()
    draw.render({
      curIndex,
      isSubmitHistory: false
    })
  } else {
    // 存在值：无法触发input事件需手动检测并触发渲染
    setTimeout(() => {
      if (host.compositionInfo) {
        input(evt.data, host)
      }
    }, 1) // 如果为0，火狐浏览器会在input事件之前执行导致重复输入
  }
  // 移除代理输入框数据
  const cursor = draw.getCursor()
  cursor.clearAgentDomValue()
}

export default {
  compositionstart,
  compositionend
}
