export interface IOverrideResult {
  preventDefault?: boolean
}

export class Override {
  public paste:
    | ((evt?: ClipboardEvent) => unknown | IOverrideResult)
    | undefined
  public copy: (() => unknown | IOverrideResult) | undefined
  public drop: ((evt: DragEvent) => unknown | IOverrideResult) | undefined
}
