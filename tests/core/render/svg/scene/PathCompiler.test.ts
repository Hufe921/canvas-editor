import { describe, expect, it } from 'vitest'
import { PathCompiler } from '@/editor/core/render/svg/scene/PathCompiler'

describe('PathCompiler', () => {
  it('编译 move、line、rect 和 closePath，并保留多个子路径', () => {
    const path = new PathCompiler()
    path.moveTo(1, 2)
    path.lineTo(3, 4)
    path.closePath()
    path.rect(1, 2, 5, 6)

    expect(path.getPathData()).toBe(
      'M 1 2 L 3 4 Z M 1 2 H 6 V 8 H 1 Z'
    )
  })

  it('closePath 后的线段从当前子路径起点继续', () => {
    const path = new PathCompiler()
    path.moveTo(1, 2)
    path.lineTo(3, 4)
    path.closePath()
    path.lineTo(5, 6)

    expect(path.getPathData()).toBe('M 1 2 L 3 4 Z L 5 6')
  })

  it('编译二次和三次贝塞尔曲线', () => {
    const path = new PathCompiler()
    path.moveTo(0, 0)
    path.quadraticCurveTo(1, 2, 3, 4)
    path.bezierCurveTo(5, 6, 7, 8, 9, 10)

    expect(path.getPathData()).toBe(
      'M 0 0 Q 1 2 3 4 C 5 6 7 8 9 10'
    )
  })

  it('将一般端点弧转换为 SVG 圆弧，顺时针使用正向 sweep', () => {
    const path = new PathCompiler()
    path.arc(0, 0, 10, 0, Math.PI / 2)

    expect(path.getPathData()).toBe('M 10 0 A 10 10 0 0 1 0 10')
  })

  it('已有路径时按 Canvas 语义连接圆弧起点，并支持逆时针弧', () => {
    const path = new PathCompiler()
    path.moveTo(-5, 0)
    path.arc(0, 0, 10, Math.PI / 2, 0, true)

    expect(path.getPathData()).toBe(
      'M -5 0 L 0 10 A 10 10 0 0 0 10 0'
    )
  })

  it('将超过半圆的弧标记为 large-arc', () => {
    const path = new PathCompiler()
    path.arc(0, 0, 10, 0, Math.PI)

    expect(path.getPathData()).toBe('M 10 0 A 10 10 0 0 1 -10 0')
    path.moveTo(10, 0)
    path.arc(0, 0, 10, 0, (3 * Math.PI) / 2)

    expect(path.getPathData()).toBe(
      'M 10 0 A 10 10 0 0 1 -10 0 M 10 0 A 10 10 0 1 1 0 -10'
    )
  })

  it('用两个 SVG 圆弧表示顺时针和逆时针整圆', () => {
    const clockwise = new PathCompiler()
    clockwise.arc(0, 0, 10, 0, Math.PI * 2)
    expect(clockwise.getPathData()).toBe(
      'M 10 0 A 10 10 0 1 1 -10 0 A 10 10 0 1 1 10 0'
    )

    const counterclockwise = new PathCompiler()
    counterclockwise.arc(0, 0, 10, 0, -Math.PI * 2, true)
    expect(counterclockwise.getPathData()).toBe(
      'M 10 0 A 10 10 0 1 0 -10 0 A 10 10 0 1 0 10 0'
    )
  })

  it('反方向的角度差不误判为整圆，并按指定方向归一化', () => {
    const noArc = new PathCompiler()
    noArc.arc(0, 0, 10, 0, -Math.PI * 2)
    expect(noArc.getPathData()).toBe('M 10 0')

    const halfArc = new PathCompiler()
    halfArc.arc(0, 0, 10, 0, -Math.PI * 3)
    expect(halfArc.getPathData()).toBe('M 10 0 A 10 10 0 0 1 -10 0')
  })
})
