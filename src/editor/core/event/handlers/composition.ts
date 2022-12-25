import { CanvasEvent } from '../CanvasEvent'

function compositionstart(host: CanvasEvent) {
  host.isCompositing = true
}

function compositionend(host: CanvasEvent) {
  host.isCompositing = false
}

export default {
  compositionstart,
  compositionend
}