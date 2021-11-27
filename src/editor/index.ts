import './assets/css/index.css'
import { ZERO } from './dataset/constant/Common'
import { IEditorOption } from './interface/Editor'
import { IElement } from './interface/Element'
import { Draw } from './core/draw/Draw'
import { Command } from './core/command/Command'
import { CommandAdapt } from './core/command/CommandAdapt'
import { Listener } from './core/listener/Listener'
import { RowFlex } from './dataset/enum/Row'
import { getUUID } from './utils'
import { ElementType } from './dataset/enum/Element'

export default class Editor {

  public command: Command
  public listener: Listener

  constructor(container: HTMLDivElement, elementList: IElement[], options: IEditorOption = {}) {
    const editorOptions: Required<IEditorOption> = {
      defaultType: 'TEXT',
      defaultFont: 'Yahei',
      defaultSize: 16,
      defaultRowMargin: 1,
      defaultBasicRowMarginHeight: 8,
      width: 794,
      height: 1123,
      pageGap: 20,
      pageNumberBottom: 60,
      underlineColor: '#000000',
      strikeoutColor: '#FF0000',
      rangeAlpha: 0.6,
      rangeColor: '#AECBFA',
      rangeMinWidth: 5,
      searchMatchAlpha: 0.6,
      searchMatchColor: '#FFFF00',
      highlightAlpha: 0.6,
      resizerColor: '#4182D9',
      resizerSize: 5,
      marginIndicatorSize: 35,
      marginIndicatorColor: '#BABABA',
      margins: [100, 120, 100, 120],
      ...options
    }
    if (elementList[0]?.value !== ZERO) {
      elementList.unshift({
        value: ZERO
      })
    }
    for (let i = 0; i < elementList.length; i++) {
      const el = elementList[i]
      if (el.value === '\n') {
        el.value = ZERO
      }
      if (el.type === ElementType.IMAGE) {
        el.id = getUUID()
      }
    }
    // 监听
    this.listener = new Listener()
    // 启动
    const draw = new Draw(container, editorOptions, elementList, this.listener)
    // 命令
    this.command = new Command(new CommandAdapt(draw))
  }

}

// 对外对象
export {
  Editor,
  RowFlex,
  ElementType
}

// 对外类型
export type {
  IElement
}