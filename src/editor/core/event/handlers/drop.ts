import { CanvasEvent } from '../CanvasEvent'
import { pasteImage } from './paste'

export function drop(evt: DragEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  // 自定义拖放事件
  const { drop } = draw.getOverride()
  if (drop) {
    drop(evt)
    return
  }
  evt.preventDefault()
  const data = evt.dataTransfer?.getData('text')
  if (data) {
    host.input(data)
  } else {
    const files = evt.dataTransfer?.files
    if (!files) return
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('image')) {
        pasteImage(host, file)
      }
    }
  }
}
