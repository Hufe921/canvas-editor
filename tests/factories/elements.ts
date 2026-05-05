import type { IElement } from '@/editor/interface/Element'
import { ElementType } from '@/editor/dataset/enum/Element'
import { TitleLevel } from '@/editor/dataset/enum/Title'

export function textEl(value: string, override: Partial<IElement> = {}): IElement {
  return { value, ...override }
}

export function newlineEl(): IElement {
  return { value: '\n' }
}

export function titleEl(value: string, level: TitleLevel = TitleLevel.FIRST): IElement {
  return { value, type: ElementType.TITLE, level }
}

export function paragraph(...elements: IElement[]): IElement[] {
  return [...elements, newlineEl()]
}
