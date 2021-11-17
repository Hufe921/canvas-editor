import './assets/css/index.css'
import { ZERO } from './dataset/constant/Common'
import { IEditorOption } from './interface/Editor'
import { IElement } from './interface/Element'
import { Draw } from './core/draw/Draw'
import { Command } from './core/command/Command'
import { CommandAdapt } from './core/command/CommandAdapt'

export default class Editor {

  public command: Command

  constructor(canvas: HTMLCanvasElement, elementList: IElement[], options: IEditorOption = {}) {
    const editorOptions: Required<IEditorOption> = {
      defaultType: 'TEXT',
      defaultFont: 'Yahei',
      defaultSize: 16,
      underlineColor: '#000000',
      strikeoutColor: '#FF0000',
      rangeAlpha: 0.6,
      rangeColor: '#AECBFA',
      searchMatchAlpha: 0.6,
      searchMatchColor: '#FFFF00',
      marginIndicatorSize: 35,
      marginIndicatorColor: '#BABABA',
      margins: [100, 120, 100, 120],
      ...options
    }
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const dpr = window.devicePixelRatio
    canvas.width = parseInt(canvas.style.width) * dpr
    canvas.height = parseInt(canvas.style.height) * dpr
    canvas.style.cursor = 'text'
    ctx.scale(dpr, dpr)
    if (elementList[0].value !== ZERO) {
      elementList.unshift({
        value: ZERO
      })
    }
    elementList.forEach(text => {
      if (text.value === '\n') {
        text.value = ZERO
      }
    })
    // 启动
    const draw = new Draw(canvas, ctx, editorOptions, elementList)
    draw.render()
    // 对外命令
    this.command = new Command(new CommandAdapt(draw))
  }

}