import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { Draw } from '../Draw'

export class Background {
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.options = draw.getOptions()
  }

  public render(ctx: CanvasRenderingContext2D) {
    const style = ctx.canvas.style

    if (this.options.backgroundColor) {
      style.backgroundColor = this.options.backgroundColor
    }

    if (this.options.backgroundSize) {
      style.backgroundSize = this.options.backgroundSize
    }

    if (this.options.background) {
      style.background = this.options.background
    }

    if (this.options.backgroundAttachment) {
      style.backgroundAttachment = this.options.backgroundAttachment
    }

    if (this.options.backgroundBlendMode) {
      style.backgroundBlendMode = this.options.backgroundBlendMode
    }
    if (this.options.backgroundClip) {
      style.backgroundClip = this.options.backgroundClip
    }

    if (this.options.backgroundImage) {
      style.backgroundImage = this.options.backgroundImage
    }

    if (this.options.backgroundOrigin) {
      style.backgroundOrigin = this.options.backgroundOrigin
    }

    if (this.options.backgroundPosition) {
      style.backgroundPosition = this.options.backgroundPosition
    }

    if (this.options.backgroundPositionX) {
      style.backgroundPositionX = this.options.backgroundPositionX
    }

    if (this.options.backgroundPositionY) {
      style.backgroundPositionY = this.options.backgroundPositionY
    }

    if (this.options.backgroundRepeat) {
      style.backgroundRepeat = this.options.backgroundRepeat
    }
  }
}
