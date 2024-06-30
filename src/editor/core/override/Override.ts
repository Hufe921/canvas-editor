export interface IOverrideResult {
  preventDefault?: boolean
}

export class Override {
  public paste:
    | ((
        evt?: ClipboardEvent
      ) => void | Promise<void> | IOverrideResult | Promise<IOverrideResult>)
    | undefined
  public copy:
    | (() => void | Promise<void> | IOverrideResult | Promise<IOverrideResult>)
    | undefined
  public drop:
    | ((
        evt: DragEvent
      ) => void | Promise<void> | IOverrideResult | Promise<IOverrideResult>)
    | undefined
}
