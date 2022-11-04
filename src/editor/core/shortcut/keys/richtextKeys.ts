import { Command } from '../../..'
import { KeyMap } from '../../../dataset/enum/KeyMap'
import { IRegisterShortcut } from '../../../interface/shortcut/Shortcut'

export const richtextKeys: IRegisterShortcut[] = [
  {
    key: KeyMap.X_UPPERCASE,
    ctrl: true,
    shift: true,
    callback: (command: Command) => {
      command.executeStrikeout()
    }
  },
  {
    key: KeyMap.LEFT_BRACKET,
    ctrl: true,
    callback: (command: Command) => {
      command.executeSizeAdd()
    }
  },
  {
    key: KeyMap.RIGHT_BRACKET,
    ctrl: true,
    callback: (command: Command) => {
      command.executeSizeMinus()
    }
  },
  {
    key: KeyMap.B,
    ctrl: true,
    callback: (command: Command) => {
      command.executeBold()
    }
  },
  {
    key: KeyMap.I,
    ctrl: true,
    callback: (command: Command) => {
      command.executeItalic()
    }
  },
  {
    key: KeyMap.U,
    ctrl: true,
    callback: (command: Command) => {
      command.executeUnderline()
    }
  },
  {
    key: KeyMap.RIGHT_ANGLE_BRACKET,
    ctrl: true,
    shift: true,
    callback: (command: Command) => {
      command.executeSuperscript()
    }
  },
  {
    key: KeyMap.LEFT_ANGLE_BRACKET,
    ctrl: true,
    shift: true,
    callback: (command: Command) => {
      command.executeSubscript()
    }
  },
  {
    key: KeyMap.L,
    ctrl: true,
    callback: (command: Command) => {
      command.executeLeft()
    }
  },
  {
    key: KeyMap.E,
    ctrl: true,
    callback: (command: Command) => {
      command.executeCenter()
    }
  },
  {
    key: KeyMap.R,
    ctrl: true,
    callback: (command: Command) => {
      command.executeRight()
    }
  },
  {
    key: KeyMap.J,
    ctrl: true,
    callback: (command: Command) => {
      command.executeAlignment()
    }
  }
]