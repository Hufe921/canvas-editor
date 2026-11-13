import type {
  ISceneResourceIdentity,
  SceneGroupKind
} from '../svg/scene/SceneNode'
import { IRenderContext, IRenderPattern, IRenderSource } from './RenderContext'

export type IRenderMethodName =
  | 'save'
  | 'restore'
  | 'fillRect'
  | 'beginPath'
  | 'moveTo'
  | 'lineTo'
  | 'arc'
  | 'quadraticCurveTo'
  | 'bezierCurveTo'
  | 'rect'
  | 'closePath'
  | 'fill'
  | 'strokeRect'
  | 'scale'
  | 'rotate'
  | 'clip'
  | 'fillText'
  | 'translate'
  | 'stroke'
  | 'drawImage'
  | 'setLineDash'

export type IRenderOperation =
  | {
      type: 'set'
      property: string
      value: unknown
    }
  | {
      type: IRenderMethodName
      args: unknown[]
    }
  | {
      type: 'beginGroup'
      key: string
      kind: SceneGroupKind
    }
  | {
      type: 'endGroup'
    }

interface IRenderState {
  lineWidth: number
  lineDash: number[]
}

export class DisplayList implements IRenderContext {
  private operations: IRenderOperation[]
  private state: IRenderState
  private stateStack: IRenderState[]

  constructor() {
    this.operations = []
    this.state = {
      lineWidth: 1,
      lineDash: []
    }
    this.stateStack = []
  }

  public getOperations(): readonly IRenderOperation[] {
    return this.operations
  }

  public get lineWidth(): number {
    return this.state.lineWidth
  }

  public set lineWidth(value: number) {
    this.state.lineWidth = value
    this.set('lineWidth', value)
  }

  public set fillStyle(
    value: string | CanvasGradient | CanvasPattern | IRenderPattern
  ) {
    this.set('fillStyle', value)
  }

  public set strokeStyle(value: string | CanvasGradient | CanvasPattern) {
    this.set('strokeStyle', value)
  }

  public set font(value: string) {
    this.set('font', value)
  }

  public set globalAlpha(value: number) {
    this.set('globalAlpha', value)
  }

  public set textAlign(value: 'center' | 'end' | 'left' | 'right' | 'start') {
    this.set('textAlign', value)
  }

  public set textBaseline(value: CanvasTextBaseline) {
    this.set('textBaseline', value)
  }

  public set lineCap(value: 'butt' | 'round' | 'square') {
    this.set('lineCap', value)
  }

  public set lineJoin(value: 'bevel' | 'miter' | 'round') {
    this.set('lineJoin', value)
  }

  public setLineDash(segments: number[]): void {
    this.state.lineDash = [...segments]
    this.record('setLineDash', segments)
  }

  public getLineDash(): number[] {
    return [...this.state.lineDash]
  }

  public createPattern(
    image: CanvasImageSource,
    repetition: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat',
    resource?: ISceneResourceIdentity
  ): IRenderPattern {
    return {
      type: 'pattern',
      image,
      repetition,
      resource
    }
  }

  public beginGroup(key: string, kind: SceneGroupKind): void {
    this.operations.push({ type: 'beginGroup', key, kind })
  }

  public endGroup(): void {
    this.operations.push({ type: 'endGroup' })
  }

  public save(): void {
    this.stateStack.push({ ...this.state })
    this.record('save')
  }

  public restore(): void {
    const state = this.stateStack.pop()
    if (state) this.state = state
    this.record('restore')
  }

  public fillRect(x: number, y: number, width: number, height: number): void {
    this.record('fillRect', x, y, width, height)
  }

  public beginPath(): void {
    this.record('beginPath')
  }

  public moveTo(x: number, y: number): void {
    this.record('moveTo', x, y)
  }

  public lineTo(x: number, y: number): void {
    this.record('lineTo', x, y)
  }

  public arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean
  ): void {
    this.record('arc', x, y, radius, startAngle, endAngle, counterclockwise)
  }

  public quadraticCurveTo(
    cpx: number,
    cpy: number,
    x: number,
    y: number
  ): void {
    this.record('quadraticCurveTo', cpx, cpy, x, y)
  }

  public bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ): void {
    this.record('bezierCurveTo', cp1x, cp1y, cp2x, cp2y, x, y)
  }

  public rect(x: number, y: number, width: number, height: number): void {
    this.record('rect', x, y, width, height)
  }

  public closePath(): void {
    this.record('closePath')
  }

  public fill(): void {
    this.record('fill')
  }

  public strokeRect(x: number, y: number, width: number, height: number): void {
    this.record('strokeRect', x, y, width, height)
  }

  public scale(x: number, y: number): void {
    this.record('scale', x, y)
  }

  public rotate(angle: number): void {
    this.record('rotate', angle)
  }

  public clip(): void {
    this.record('clip')
  }

  public fillText(text: string, x: number, y: number): void {
    this.record('fillText', text, x, y)
  }

  public fillTextWithSource(
    text: string,
    x: number,
    y: number,
    source: IRenderSource
  ): void {
    this.record('fillText', text, x, y, source)
  }

  public translate(x: number, y: number): void {
    this.record('translate', x, y)
  }

  public stroke(): void {
    this.record('stroke')
  }

  public drawImage(
    image: CanvasImageSource,
    ...args:
      | [number, number, number, number]
      | [number, number, number, number, number, number, number, number]
  ): void {
    this.record('drawImage', image, ...args)
  }

  private set(property: string, value: unknown): void {
    this.operations.push({ type: 'set', property, value })
  }

  private record(type: IRenderMethodName, ...args: unknown[]): void {
    this.operations.push({ type, args })
  }
}
