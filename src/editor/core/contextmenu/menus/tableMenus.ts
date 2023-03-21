import { VerticalAlign } from '../../../dataset/enum/VerticalAlign'
import { IRegisterContextMenu } from '../../../interface/contextmenu/ContextMenu'
import { Command } from '../../command/Command'

export const tableMenus: IRegisterContextMenu[] = [
  {
    isDivider: true
  },
  {
    i18nPath: 'contextmenu.table.verticalAlign',
    icon: 'vertical-align',
    when: (payload) => {
      return !payload.isReadonly && payload.isInTable
    },
    childMenus: [
      {
        i18nPath: 'contextmenu.table.verticalAlignTop',
        icon: 'vertical-align-top',
        when: () => true,
        callback: (command: Command) => {
          command.executeTableTdVerticalAlign(VerticalAlign.TOP)
        }
      },
      {
        i18nPath: 'contextmenu.table.verticalAlignMiddle',
        icon: 'vertical-align-middle',
        when: () => true,
        callback: (command: Command) => {
          command.executeTableTdVerticalAlign(VerticalAlign.MIDDLE)
        }
      },
      {
        i18nPath: 'contextmenu.table.verticalAlignBottom',
        icon: 'vertical-align-bottom',
        when: () => true,
        callback: (command: Command) => {
          command.executeTableTdVerticalAlign(VerticalAlign.BOTTOM)
        }
      }
    ]
  },
  {
    i18nPath: 'contextmenu.table.insertRowCol',
    icon: 'insert-row-col',
    when: (payload) => {
      return !payload.isReadonly && payload.isInTable
    },
    childMenus: [
      {
        i18nPath: 'contextmenu.table.insertTopRow',
        icon: 'insert-top-row',
        when: () => true,
        callback: (command: Command) => {
          command.executeInsertTableTopRow()
        }
      },
      {
        i18nPath: 'contextmenu.table.insertBottomRow',
        icon: 'insert-bottom-row',
        when: () => true,
        callback: (command: Command) => {
          command.executeInsertTableBottomRow()
        }
      },
      {
        i18nPath: 'contextmenu.table.insertLeftCol',
        icon: 'insert-left-col',
        when: () => true,
        callback: (command: Command) => {
          command.executeInsertTableLeftCol()
        }
      },
      {
        i18nPath: 'contextmenu.table.insertRightCol',
        icon: 'insert-right-col',
        when: () => true,
        callback: (command: Command) => {
          command.executeInsertTableRightCol()
        }
      }
    ]
  },
  {
    i18nPath: 'contextmenu.table.deleteRowCol',
    icon: 'delete-row-col',
    when: (payload) => {
      return !payload.isReadonly && payload.isInTable
    },
    childMenus: [
      {
        i18nPath: 'contextmenu.table.deleteRow',
        icon: 'delete-row',
        when: () => true,
        callback: (command: Command) => {
          command.executeDeleteTableRow()
        }
      },
      {
        i18nPath: 'contextmenu.table.deleteCol',
        icon: 'delete-col',
        when: () => true,
        callback: (command: Command) => {
          command.executeDeleteTableCol()
        }
      },
      {
        i18nPath: 'contextmenu.table.deleteTable',
        icon: 'delete-table',
        when: () => true,
        callback: (command: Command) => {
          command.executeDeleteTable()
        }
      }
    ]
  },
  {
    i18nPath: 'contextmenu.table.mergeCell',
    icon: 'merge-cell',
    when: (payload) => {
      return !payload.isReadonly && payload.isCrossRowCol
    },
    callback: (command: Command) => {
      command.executeMergeTableCell()
    }
  },
  {
    i18nPath: 'contextmenu.table.mergeCancelCell',
    icon: 'merge-cancel-cell',
    when: (payload) => {
      return !payload.isReadonly && payload.isInTable
    },
    callback: (command: Command) => {
      command.executeCancelMergeTableCell()
    }
  }
]