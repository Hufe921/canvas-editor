import { IRegisterShortcut } from '../../interface/shortcut/Shortcut'
import { richtextKeys } from './keys/richtextKeys'
import { Command } from '../command/Command'
import { Draw } from '../draw/Draw'

export class Shortcut {

  private command: Command
  private globalShortcutList: IRegisterShortcut[]
  private agentShortcutList: IRegisterShortcut[]

  constructor(draw: Draw, command: Command) {
    this.command = command
    this.globalShortcutList = []
    this.agentShortcutList = []
    // 内部快捷键
    this._addShortcutList([
      ...richtextKeys
    ])
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
    for (let s = 0; s < payload.length; s++) {
      const shortCut = payload[s]
      if (shortCut.isGlobal) {
        this.globalShortcutList.push(shortCut)
      } else {
        this.agentShortcutList.push(shortCut)
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
        evt.ctrlKey === !!shortCut.ctrl &&
        evt.shiftKey === !!shortCut.shift &&
        evt.altKey === !!shortCut.alt &&
        evt.key === shortCut.key
      ) {
        shortCut.callback(this.command)
        evt.preventDefault()
        break
      }
    }
  }

}
