import type { Command } from '../command/Command'
import type {
  IMacro,
  IMacroStep,
  IRecordedMacro,
  IScriptMacro,
  IMacroHandler
} from '../../interface/Macro'
import { MacroType } from '../../dataset/enum/Macro'
import { getUUID } from '../../utils'

export class MacroManager {
  private macros: Map<string, IMacro> = new Map()
  private recording: IMacroStep[] | null = null
  private isPlaying = false
  private command: Command

  constructor(command: Command) {
    this.command = command
  }

  public isRecording(): boolean {
    return this.recording !== null
  }

  // 通过 Command 拦截器录制每一步 execute* 调用
  public startRecording(): void {
    if (this.recording !== null) return
    if (this.isPlaying) return
    this.recording = []
    this.command.setInterceptor((name, args) => this.logStep(name, args))
  }

  public stopRecording(name: string): IRecordedMacro | null {
    if (this.recording === null) return null
    this.command.setInterceptor(undefined)
    const macro: IRecordedMacro = {
      id: getUUID(),
      name,
      type: MacroType.RECORDED,
      steps: this.recording
    }
    this.recording = null
    this.macros.set(macro.id, macro)
    return macro
  }

  public cancelRecording(): void {
    if (this.recording === null) return
    this.command.setInterceptor(undefined)
    this.recording = null
  }

  public async play(idOrName: string, ...args: unknown[]): Promise<void> {
    if (this.recording !== null) return
    const m = this.findMacro(idOrName)
    if (!m) return
    this.isPlaying = true
    try {
      if (m.type === MacroType.RECORDED) {
        for (const step of m.steps) {
          // 命令方法签名各异，无法用统一类型描述，这里按名动态分发
          const fn = (this.command as any)[step.command]
          if (typeof fn !== 'function') return
          try {
            await fn.apply(this.command, step.args)
          } catch {
            return
          }
        }
      } else {
        await m.handler(...args)
      }
    } finally {
      this.isPlaying = false
    }
  }

  public getMacros(): IMacro[] {
    return Array.from(this.macros.values())
  }

  public getMacro(idOrName: string): IMacro | undefined {
    return this.findMacro(idOrName)
  }

  public removeMacro(idOrName: string): boolean {
    const m = this.findMacro(idOrName)
    if (!m) return false
    return this.macros.delete(m.id)
  }

  public exportMacros(): string {
    const recorded = this.getMacros().filter(
      (m): m is IRecordedMacro => m.type === MacroType.RECORDED
    )
    return JSON.stringify(recorded)
  }

  // overwrite 为 false 时跳过已存在的 id，避免覆盖同名宏
  public importMacros(json: string, options?: { overwrite?: boolean }): void {
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      return
    }
    if (!Array.isArray(parsed)) return
    const overwrite = options?.overwrite ?? false
    for (const item of parsed) {
      if (!isValidRecordedMacro(item)) return
      if (this.macros.has(item.id) && !overwrite) continue
      this.macros.set(item.id, { ...item })
    }
  }

  public register(name: string, handler: IMacroHandler): IScriptMacro {
    const macro: IScriptMacro = {
      id: getUUID(),
      name,
      type: MacroType.SCRIPT,
      handler
    }
    this.macros.set(macro.id, macro)
    return macro
  }

  public unregister(idOrName: string): boolean {
    const m = this.findMacro(idOrName)
    if (!m) return false
    return this.macros.delete(m.id)
  }

  // 先按 id 查，再按 name 查
  private findMacro(idOrName: string): IMacro | undefined {
    if (this.macros.has(idOrName)) {
      return this.macros.get(idOrName)
    }
    for (const m of this.macros.values()) {
      if (m.name === idOrName) return m
    }
    return undefined
  }

  private logStep(name: string, args: unknown[]): void {
    if (this.recording === null) return
    // JSON 往返既深拷贝又校验可序列化：含 DOM/函数等不可序列化的参数会被丢弃
    let safeArgs: unknown[]
    try {
      safeArgs = JSON.parse(JSON.stringify(args))
    } catch {
      return
    }
    this.recording.push({ command: name, args: safeArgs })
  }
}

function isValidStep(v: unknown): v is IMacroStep {
  if (typeof v !== 'object' || v === null) return false
  const s = v as Record<string, unknown>
  return typeof s.command === 'string' && Array.isArray(s.args)
}

function isValidRecordedMacro(v: unknown): v is IRecordedMacro {
  if (typeof v !== 'object' || v === null) return false
  const m = v as Record<string, unknown>
  return (
    typeof m.id === 'string' &&
    typeof m.name === 'string' &&
    m.type === MacroType.RECORDED &&
    Array.isArray(m.steps) &&
    m.steps.every(isValidStep)
  )
}
