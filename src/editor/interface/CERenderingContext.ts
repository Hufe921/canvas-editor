import { ITextMetrics } from './Text'
import { Draw } from '../core/draw/Draw'

export interface CERenderingContext {

  drawImage(value: HTMLImageElement | string, dx: number, dy: number, width: number, height: number): void

  fillRect(x: number, y: number, width: number, height: number, prop: LineProperty): void

  strokeRect(x: number, y: number, width: number, height: number, prop: LineProperty): void

  line(prop: LineProperty): LineDrawer

  circle(x: number, y: number, r: number, prop: LineProperty): void

  translate(x: number, y: number): void

  scale(x: number, y: number): void

  measureText(text: string, prop?: FontProperty): ITextMetrics

  text(text: string, x: number, y: number, prop: FontProperty): void

  initPageContext(scale: number, direction: TextDirection): void

  setGlobalAlpha(alpha: number): void

  getGlobalAlpha(): number

  getFont(): string

  addWatermark(data: HTMLCanvasElement, area: DrawArea): void
  addWatermarkSingle(data: string, draw: Draw, prop: FontProperty, metrics: ITextMetrics): void

  cleanPage(pageWidth: number, pageHeight: number): void;
}

export interface LineDrawer {
  path(x1: number, y1: number, x2?: number, y2?: number): LineDrawer

  beforeDraw(action: (ctx: CERenderingContext) => void): LineDrawer

  draw(): void
}

export interface LineProperty {
  color?: string
  fillColor?: string
  alpha?: number
  lineWidth?: number
  lineDash?: number[],
  lineCap?: 'round' | 'butt' | 'square',
  lineJoin?: 'bevel' | 'miter' | 'round'
  translate?: [number, number]
}

export type TextBaseline = 'alphabetic' | 'bottom' | 'hanging' | 'ideographic' | 'middle' | 'top';
export type TextAlign = 'left' | 'center' | 'right'
export type TextDirection = 'ltr' | 'rtl';


export interface FontProperty {
  font?: string
  size?: number
  alpha?: number
  textAlign?: TextAlign
  textBaseline?: TextBaseline
  color?: string
  maxWidth?: number
  fontStyle?: string
  fontWeight?: number
  rotate?: number
  translate?: [number, number]
}

export interface DrawArea {
  startX: number
  startY: number
  width: number
  height: number
  alpha?: number
}
