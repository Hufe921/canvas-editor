import { DisplayList } from '../model/DisplayList'
import { IRenderPattern } from '../model/RenderContext'

export class CanvasRenderer {
  public render(ctx: CanvasRenderingContext2D, displayList: DisplayList): void {
    const operations = displayList.getOperations()
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i]
      if (operation.type === 'set') {
        const value = operation.value
        ;(ctx as any)[operation.property] = this._isRenderPattern(value)
          ? ctx.createPattern(value.image, value.repetition)
          : value
      } else if (
        operation.type !== 'beginGroup' &&
        operation.type !== 'endGroup'
      ) {
        const args =
          operation.type === 'fillText'
            ? operation.args.slice(0, 3)
            : operation.args
        ;(ctx as any)[operation.type](...args)
      }
    }
  }

  private _isRenderPattern(value: unknown): value is IRenderPattern {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      value.type === 'pattern'
    )
  }
}
