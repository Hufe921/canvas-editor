import { MacroType } from '../dataset/enum/Macro'

export interface IMacroStep {
  command: string
  args: unknown[]
}

export interface IRecordedMacro {
  id: string
  name: string
  type: MacroType.RECORDED
  steps: IMacroStep[]
}

export type IMacroHandler = (...args: unknown[]) => void | Promise<void>

export interface IScriptMacro {
  id: string
  name: string
  type: MacroType.SCRIPT
  handler: IMacroHandler
}

export type IMacro = IRecordedMacro | IScriptMacro
