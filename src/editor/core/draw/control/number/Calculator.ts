import {
  EDITOR_COMPONENT,
  EDITOR_PREFIX
} from '../../../../dataset/constant/Editor'
import { EditorComponent } from '../../../../dataset/enum/Editor'
import { CalculatorButtonType } from '../../../../dataset/enum/Control'
import { Control } from '../Control'

interface CalculatorOptions {
  control: Control
  onCalculate: (result: number) => void
}

export class Calculator {
  private control: Control
  private calculatorDom: HTMLDivElement | null
  private onCalculate: (result: number) => void
  private currentExpression: string

  constructor(options: CalculatorOptions) {
    this.control = options.control
    this.onCalculate = options.onCalculate
    this.calculatorDom = null
    this.currentExpression = ''
  }

  public createPopup() {
    const position = this.control.getPosition()
    if (!position) return

    // 创建计算器弹窗容器
    const calculatorPopupContainer = document.createElement('div')
    calculatorPopupContainer.classList.add(`${EDITOR_PREFIX}-calculator`)
    calculatorPopupContainer.setAttribute(
      EDITOR_COMPONENT,
      EditorComponent.POPUP
    )

    // 创建显示区域
    const display = document.createElement('div')
    display.classList.add(`${EDITOR_PREFIX}-calculator-display`)
    display.textContent = '0'

    // 创建按钮容器
    const buttonContainer = document.createElement('div')
    buttonContainer.classList.add(`${EDITOR_PREFIX}-calculator-buttons`)

    // 按钮布局
    const buttons = [
      [
        { text: 'C', type: CalculatorButtonType.UTILITY },
        { text: '←', type: CalculatorButtonType.UTILITY },
        { text: '%', type: CalculatorButtonType.OPERATOR },
        { text: '/', type: CalculatorButtonType.OPERATOR }
      ],
      [
        { text: '7', type: CalculatorButtonType.NUMBER },
        { text: '8', type: CalculatorButtonType.NUMBER },
        { text: '9', type: CalculatorButtonType.NUMBER },
        { text: '*', type: CalculatorButtonType.OPERATOR }
      ],
      [
        { text: '4', type: CalculatorButtonType.NUMBER },
        { text: '5', type: CalculatorButtonType.NUMBER },
        { text: '6', type: CalculatorButtonType.NUMBER },
        { text: '-', type: CalculatorButtonType.OPERATOR }
      ],
      [
        { text: '1', type: CalculatorButtonType.NUMBER },
        { text: '2', type: CalculatorButtonType.NUMBER },
        { text: '3', type: CalculatorButtonType.NUMBER },
        { text: '+', type: CalculatorButtonType.OPERATOR }
      ],
      [
        { text: '0', type: CalculatorButtonType.NUMBER },
        { text: '.', type: CalculatorButtonType.NUMBER },
        { text: '=', type: CalculatorButtonType.EQUAL, span: 2 }
      ]
    ]

    // 创建按钮
    buttons.forEach(row => {
      row.forEach(buttonInfo => {
        const button = document.createElement('button')
        button.classList.add(`${EDITOR_PREFIX}-calculator-button`)

        // 添加按钮类型类名
        if (buttonInfo.type === CalculatorButtonType.OPERATOR) {
          button.classList.add('operator')
        } else if (buttonInfo.type === CalculatorButtonType.EQUAL) {
          button.classList.add('equal')
        } else if (buttonInfo.type === CalculatorButtonType.UTILITY) {
          button.classList.add('utility')
        }

        button.textContent = buttonInfo.text

        // 按钮点击事件
        button.onclick = () => {
          const buttonText = buttonInfo.text
          if (buttonText === 'C') {
            // 清空
            this.currentExpression = ''
            display.textContent = '0'
          } else if (buttonText === '←') {
            // 退格
            this.currentExpression = this.currentExpression.slice(0, -1)
            display.textContent = this.currentExpression || '0'
          } else if (buttonText === '=') {
            const result = this.calculate(this.currentExpression)
            if (Number.isFinite(result)) {
              display.textContent = result.toString()
              this.currentExpression = result.toString()

              // 回调计算结果
              this.onCalculate(result)
            } else {
              display.textContent = 'Error'
              this.currentExpression = ''
            }
          } else {
            // 其他按钮
            this.currentExpression += buttonText
            display.textContent = this.currentExpression
          }
        }

        // 设置按钮跨度
        if (buttonInfo.span) {
          button.style.gridColumn = `span ${buttonInfo.span}`
        }

        buttonContainer.appendChild(button)
      })
    })

    // 组装计算器
    calculatorPopupContainer.appendChild(display)
    calculatorPopupContainer.appendChild(buttonContainer)

    // 定位
    const {
      coordinate: {
        leftTop: [left, top]
      },
      lineHeight
    } = position
    const preY = this.control.getPreY()
    calculatorPopupContainer.style.left = `${left}px`
    calculatorPopupContainer.style.top = `${top + preY + lineHeight}px`

    // 追加至container
    const container = this.control.getContainer()
    container.appendChild(calculatorPopupContainer)

    this.calculatorDom = calculatorPopupContainer
  }

  public destroy() {
    if (this.calculatorDom) {
      this.calculatorDom.remove()
      this.calculatorDom = null
    }
  }

  private calculate(expression: string): number {
    // 安全计算，使用Function而不是eval
    const result = Function('return ' + expression)()

    // 无限循环数，直接返回 1/0
    if (!Number.isFinite(result)) {
      return result
    }

    // 如果是整数，直接返回
    if (Number.isInteger(result)) {
      return result
    }

    // 如果是小数，保留最多10位小数，并去除末尾的0
    return parseFloat(result.toFixed(10))
  }
}
