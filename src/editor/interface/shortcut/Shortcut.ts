import { Command } from '../../core/command/Command'
import { KeyMap } from '../../dataset/enum/KeyMap'

export interface IRegisterShortcut {
  key: KeyMap
  ctrl?: boolean
  meta?: boolean
  mod?: boolean // windows:ctrl || mac:command
  shift?: boolean
  alt?: boolean // windows:alt || mac:option
  isGlobal?: boolean
  callback?: (command: Command) => void
  disable?: boolean
}
