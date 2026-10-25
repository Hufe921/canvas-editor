interface IPoint {
  x: number
  y: number
}

const TAU = Math.PI * 2

export class PathCompiler {
  private commands: string[] = []
  private currentPoint: IPoint | null = null
  private subpathStart: IPoint | null = null

  public moveTo(x: number, y: number): void {
    this.commands.push(`M ${this._number(x)} ${this._number(y)}`)
    this.currentPoint = { x, y }
    this.subpathStart = { x, y }
  }

  public lineTo(x: number, y: number): void {
    if (!this.currentPoint) {
      this.moveTo(x, y)
      return
    }
    this.commands.push(`L ${this._number(x)} ${this._number(y)}`)
    this.currentPoint = { x, y }
  }

  public rect(x: number, y: number, width: number, height: number): void {
    this.commands.push(
      `M ${this._number(x)} ${this._number(y)} H ${this._number(
        x + width
      )} V ${this._number(y + height)} H ${this._number(x)} Z`
    )
    this.currentPoint = { x, y }
    this.subpathStart = { x, y }
  }

  public closePath(): void {
    if (!this.subpathStart) return
    this.commands.push('Z')
    this.currentPoint = { ...this.subpathStart }
  }

  public quadraticCurveTo(
    cpx: number,
    cpy: number,
    x: number,
    y: number
  ): void {
    if (!this.currentPoint) this.moveTo(cpx, cpy)
    this.commands.push(
      `Q ${this._number(cpx)} ${this._number(cpy)} ${this._number(
        x
      )} ${this._number(y)}`
    )
    this.currentPoint = { x, y }
  }

  public bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ): void {
    if (!this.currentPoint) this.moveTo(cp1x, cp1y)
    this.commands.push(
      `C ${this._number(cp1x)} ${this._number(cp1y)} ${this._number(
        cp2x
      )} ${this._number(cp2y)} ${this._number(x)} ${this._number(y)}`
    )
    this.currentPoint = { x, y }
  }

  public arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise = false
  ): void {
    if (radius < 0) throw new Error('Arc radius must not be negative')
    const start = {
      x: x + radius * Math.cos(startAngle),
      y: y + radius * Math.sin(startAngle)
    }
    this._connectTo(start)
    if (radius === 0) {
      this.lineTo(x, y)
      return
    }
    const angleLength = endAngle - startAngle
    if (
      (!counterclockwise && angleLength >= TAU) ||
      (counterclockwise && angleLength <= -TAU)
    ) {
      const opposite = {
        x: x + radius * Math.cos(startAngle + Math.PI),
        y: y + radius * Math.sin(startAngle + Math.PI)
      }
      const sweep = counterclockwise ? 0 : 1
      this._arcTo(opposite, radius, 1, sweep)
      this._arcTo(start, radius, 1, sweep)
      return
    }
    let delta = counterclockwise ? -angleLength : angleLength
    delta %= TAU
    if (delta < 0) delta += TAU
    if (delta === 0) return
    const end = {
      x: x + radius * Math.cos(endAngle),
      y: y + radius * Math.sin(endAngle)
    }
    this._arcTo(end, radius, delta > Math.PI ? 1 : 0, counterclockwise ? 0 : 1)
  }

  public getPathData(): string {
    return this.commands.join(' ')
  }

  private _connectTo(point: IPoint): void {
    if (!this.currentPoint) {
      this.moveTo(point.x, point.y)
    } else if (
      this.currentPoint.x !== point.x ||
      this.currentPoint.y !== point.y
    ) {
      this.lineTo(point.x, point.y)
    }
  }

  private _arcTo(
    point: IPoint,
    radius: number,
    largeArc: number,
    sweep: number
  ): void {
    this.commands.push(
      `A ${this._number(radius)} ${this._number(
        radius
      )} 0 ${largeArc} ${sweep} ${this._number(point.x)} ${this._number(
        point.y
      )}`
    )
    this.currentPoint = point
  }

  private _number(value: number): string {
    return String(Math.abs(value) < 1e-12 ? 0 : value)
  }
}
