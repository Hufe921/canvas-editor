import type {
  ISceneResourceIdentity,
  SceneGroupKind
} from '../svg/scene/SceneNode'

export interface IRenderPattern {
  type: 'pattern'
  image: CanvasImageSource
  repetition: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat'
  resource?: ISceneResourceIdentity
}

export interface IRenderSource {
  key: string
}

export interface IRenderContext {
  fillStyle: any
  strokeStyle: string | CanvasGradient | CanvasPattern
  font: string
  globalAlpha: number
  textAlign: 'center' | 'end' | 'left' | 'right' | 'start'
  textBaseline: CanvasTextBaseline
  lineWidth: number
  lineCap: 'butt' | 'round' | 'square'
  lineJoin: 'bevel' | 'miter' | 'round'
  beginGroup?(key: string, kind: SceneGroupKind): void
  endGroup?(): void
  save(): void
  restore(): void
  setLineDash(segments: number[]): void
  getLineDash(): number[]
  createPattern(
    image: CanvasImageSource,
    repetition: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat',
    resource?: ISceneResourceIdentity
  ): CanvasPattern | IRenderPattern | null
  fillRect(x: number, y: number, width: number, height: number): void
  strokeRect(x: number, y: number, width: number, height: number): void
  beginPath(): void
  closePath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean
  ): void
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void
  bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ): void
  rect(x: number, y: number, width: number, height: number): void
  fill(): void
  stroke(): void
  clip(): void
  fillText(text: string, x: number, y: number): void
  fillTextWithSource?(
    text: string,
    x: number,
    y: number,
    source: IRenderSource
  ): void
  translate(x: number, y: number): void
  scale(x: number, y: number): void
  rotate(angle: number): void
  drawImage(
    image: CanvasImageSource,
    x: number,
    y: number,
    width: number,
    height: number
  ): void
  drawImage(
    image: CanvasImageSource,
    sx: number,
    sy: number,
    sWidth: number,
    sHeight: number,
    dx: number,
    dy: number,
    dWidth: number,
    dHeight: number
  ): void
}
