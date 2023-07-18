import { CanvasEvent } from '../CanvasEvent'

export function drop(evt: DragEvent, host: CanvasEvent) {
  evt.preventDefault()
  const data = evt.dataTransfer?.getData('text')
  if (data) {
    host.input(data)
  }
}
