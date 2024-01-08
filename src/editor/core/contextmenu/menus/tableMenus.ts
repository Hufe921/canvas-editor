import { INTERNAL_CONTEXT_MENU_KEY } from '../../../dataset/constant/ContextMenu'
import { VerticalAlign } from '../../../dataset/enum/VerticalAlign'
import {
  TableBorder,
  TdBorder,
  TdSlash
} from '../../../dataset/enum/table/Table'
import { IRegisterContextMenu } from '../../../interface/contextmenu/ContextMenu'
import { Command } from '../../command/Command'
const {
  TABLE: {
    BORDER,
    BORDER_ALL,
    BORDER_EMPTY,
    BORDER_EXTERNAL,
    BORDER_TD,
    BORDER_TD_TOP,
    BORDER_TD_LEFT,
    BORDER_TD_BOTTOM,
    BORDER_TD_RIGHT,
    BORDER_TD_BACK,
    BORDER_TD_FORWARD,
    VERTICAL_ALIGN,
    VERTICAL_ALIGN_TOP,
    VERTICAL_ALIGN_MIDDLE,
    VERTICAL_ALIGN_BOTTOM,
    INSERT_ROW_COL,
    INSERT_TOP_ROW,
    INSERT_BOTTOM_ROW,
    INSERT_LEFT_COL,
    INSERT_RIGHT_COL,
    DELETE_ROW_COL,
    DELETE_ROW,
    DELETE_COL,
    DELETE_TABLE,
    MERGE_CELL,
    CANCEL_MERGE_CELL
  }
} = INTERNAL_CONTEXT_MENU_KEY

export const tableMenus: IRegisterContextMenu[] = [
  {
    isDivider: true
  },
  {
    key: BORDER,
    i18nPath: 'contextmenu.table.border',
    icon: 'border-all',
    when: payload => {
      return !payload.isReadonly && payload.isInTable
    },
    childMenus: [
      {
        key: BORDER_ALL,
        i18nPath: 'contextmenu.table.borderAll',
        icon: 'border-all',
        when: () => true,
        callback: (command: Command) => {
          command.executeTableBorderType(TableBorder.ALL)
        }
      },
      {
        key: BORDER_EMPTY,
        i18nPath: 'contextmenu.table.borderEmpty',
        icon: 'border-empty',
        when: () => true,
        callback: (command: Command) => {
          command.executeTableBorderType(TableBorder.EMPTY)
        }
      },
      {
        key: BORDER_EXTERNAL,
        i18nPath: 'contextmenu.table.borderExternal',
        icon: 'border-external',
        when: () => true,
        callback: (command: Command) => {
          command.executeTableBorderType(TableBorder.EXTERNAL)
        }
      },
      {
        key: BORDER_TD,
        i18nPath: 'contextmenu.table.borderTd',
        icon: 'border-td',
        when: () => true,
        childMenus: [
          {
            key: BORDER_TD_TOP,
            i18nPath: 'contextmenu.table.borderTdTop',
            icon: 'border-td-top',
            when: () => true,
            callback: (command: Command) => {
              command.executeTableTdBorderType(TdBorder.TOP)
            }
          },
          {
            key: BORDER_TD_RIGHT,
            i18nPath: 'contextmenu.table.borderTdRight',
            icon: 'border-td-right',
            when: () => true,
            callback: (command: Command) => {
              command.executeTableTdBorderType(TdBorder.RIGHT)
            }
          },
          {
            key: BORDER_TD_BOTTOM,
            i18nPath: 'contextmenu.table.borderTdBottom',
            icon: 'border-td-bottom',
            when: () => true,
            callback: (command: Command) => {
              command.executeTableTdBorderType(TdBorder.BOTTOM)
            }
          },
          {
            key: BORDER_TD_LEFT,
            i18nPath: 'contextmenu.table.borderTdLeft',
            icon: 'border-td-left',
            when: () => true,
            callback: (command: Command) => {
              command.executeTableTdBorderType(TdBorder.LEFT)
            }
          },
          {
            key: BORDER_TD_FORWARD,
            i18nPath: 'contextmenu.table.borderTdForward',
            icon: 'border-td-forward',
            when: () => true,
            callback: (command: Command) => {
              command.executeTableTdSlashType(TdSlash.FORWARD)
            }
          },
          {
            key: BORDER_TD_BACK,
            i18nPath: 'contextmenu.table.borderTdBack',
            icon: 'border-td-back',
            when: () => true,
            callback: (command: Command) => {
              command.executeTableTdSlashType(TdSlash.BACK)
            }
          }
        ]
      }
    ]
  },
  {
    key: VERTICAL_ALIGN,
    i18nPath: 'contextmenu.table.verticalAlign',
    icon: 'vertical-align',
    when: payload => {
      return !payload.isReadonly && payload.isInTable
    },
    childMenus: [
      {
        key: VERTICAL_ALIGN_TOP,
        i18nPath: 'contextmenu.table.verticalAlignTop',
        icon: 'vertical-align-top',
        when: () => true,
        callback: (command: Command) => {
          command.executeTableTdVerticalAlign(VerticalAlign.TOP)
        }
      },
      {
        key: VERTICAL_ALIGN_MIDDLE,
        i18nPath: 'contextmenu.table.verticalAlignMiddle',
        icon: 'vertical-align-middle',
        when: () => true,
        callback: (command: Command) => {
          command.executeTableTdVerticalAlign(VerticalAlign.MIDDLE)
        }
      },
      {
        key: VERTICAL_ALIGN_BOTTOM,
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
    key: INSERT_ROW_COL,
    i18nPath: 'contextmenu.table.insertRowCol',
    icon: 'insert-row-col',
    when: payload => {
      return !payload.isReadonly && payload.isInTable
    },
    childMenus: [
      {
        key: INSERT_TOP_ROW,
        i18nPath: 'contextmenu.table.insertTopRow',
        icon: 'insert-top-row',
        when: () => true,
        callback: (command: Command) => {
          command.executeInsertTableTopRow()
        }
      },
      {
        key: INSERT_BOTTOM_ROW,
        i18nPath: 'contextmenu.table.insertBottomRow',
        icon: 'insert-bottom-row',
        when: () => true,
        callback: (command: Command) => {
          command.executeInsertTableBottomRow()
        }
      },
      {
        key: INSERT_LEFT_COL,
        i18nPath: 'contextmenu.table.insertLeftCol',
        icon: 'insert-left-col',
        when: () => true,
        callback: (command: Command) => {
          command.executeInsertTableLeftCol()
        }
      },
      {
        key: INSERT_RIGHT_COL,
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
    key: DELETE_ROW_COL,
    i18nPath: 'contextmenu.table.deleteRowCol',
    icon: 'delete-row-col',
    when: payload => {
      return !payload.isReadonly && payload.isInTable
    },
    childMenus: [
      {
        key: DELETE_ROW,
        i18nPath: 'contextmenu.table.deleteRow',
        icon: 'delete-row',
        when: () => true,
        callback: (command: Command) => {
          command.executeDeleteTableRow()
        }
      },
      {
        key: DELETE_COL,
        i18nPath: 'contextmenu.table.deleteCol',
        icon: 'delete-col',
        when: () => true,
        callback: (command: Command) => {
          command.executeDeleteTableCol()
        }
      },
      {
        key: DELETE_TABLE,
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
    key: MERGE_CELL,
    i18nPath: 'contextmenu.table.mergeCell',
    icon: 'merge-cell',
    when: payload => {
      return !payload.isReadonly && payload.isCrossRowCol
    },
    callback: (command: Command) => {
      command.executeMergeTableCell()
    }
  },
  {
    key: CANCEL_MERGE_CELL,
    i18nPath: 'contextmenu.table.mergeCancelCell',
    icon: 'merge-cancel-cell',
    when: payload => {
      return !payload.isReadonly && payload.isInTable
    },
    callback: (command: Command) => {
      command.executeCancelMergeTableCell()
    }
  }
]
