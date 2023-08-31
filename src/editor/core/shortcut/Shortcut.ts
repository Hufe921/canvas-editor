import { IRegisterShortcut } from '../../interface/shortcut/Shortcut'
import { richtextKeys } from './keys/richtextKeys'
import { Command } from '../command/Command'
import { Draw } from '../draw/Draw'
import { isMod } from '../../utils/hotkey'
import { titleKeys } from './keys/titleKeys'
import { listKeys } from './keys/listKeys'

export class Shortcut {
  private command: Command
  private globalShortcutList: IRegisterShortcut[]
  private agentShortcutList: IRegisterShortcut[]

  constructor(draw: Draw, command: Command) {
    this.command = command
    this.globalShortcutList = []
    this.agentShortcutList = []
    // 内部快捷键
    this._addShortcutList([...richtextKeys, ...titleKeys, ...listKeys])
    // 全局快捷键
    this._addEvent()
    // 编辑器快捷键
    const agentDom = draw.getCursor().getAgentDom()
    agentDom.addEventListener('keydown', this._agentKeydown.bind(this))
  }

  private _addEvent() {
    document.addEventListener('keydown', this._globalKeydown)
  }

  public removeEvent() {
    document.removeEventListener('keydown', this._globalKeydown)
  }

  private _addShortcutList(payload: IRegisterShortcut[]) {
    for (let s = payload.length - 1; s >= 0; s--) {
      const shortCut = payload[s]
      if (shortCut.isGlobal) {
        this.globalShortcutList.unshift(shortCut)
      } else {
        this.agentShortcutList.unshift(shortCut)
      }
    }
  }

  public registerShortcutList(payload: IRegisterShortcut[]) {
    this._addShortcutList(payload)
  }

  private _globalKeydown = (evt: KeyboardEvent) => {
    if (!this.globalShortcutList.length) return
    this._execute(evt, this.globalShortcutList)
  }

  private _agentKeydown(evt: KeyboardEvent) {
    if (!this.agentShortcutList.length) return
    this._execute(evt, this.agentShortcutList)
  }

  private _execute(evt: KeyboardEvent, shortCutList: IRegisterShortcut[]) {
    for (let s = 0; s < shortCutList.length; s++) {
      const shortCut = shortCutList[s]
      if (
        (shortCut.mod
          ? isMod(evt) === !!shortCut.mod
          : evt.ctrlKey === !!shortCut.ctrl &&
            evt.metaKey === !!shortCut.meta) &&
        evt.shiftKey === !!shortCut.shift &&
        evt.altKey === !!shortCut.alt &&
        evt.key === shortCut.key
      ) {
        if (!shortCut.disable) {
          shortCut?.callback?.(this.command)
          evt.preventDefault()
        }
        break
      }
    }
  }
}
