const pi = Math.PI
const tau = 2 * pi
const epsilon = 1e-6
const tauEpsilon = tau - epsilon

export class CanvasPath2SvgPath {

  private _x0: number
  private _y0: number
  private _x1: number
  private _y1: number
  private _ = ''

  constructor() {
    this._x0 = 0
    this._y0 = 0
    this._x1 = 0
    this._y1 = 0
    this._ = ''
  }

  moveTo(x: number, y: number) {
    this._ += 'M' + (this._x0 = this._x1 = +x) + ',' + (this._y0 = this._y1 = +y)
  }

  closePath() {
    if (this._x1 !== null) {
      this._x1 = this._x0, this._y1 = this._y0
      this._ += 'Z'
    }
  }

  lineTo(x: number, y: number) {
    this._ += 'L' + (this._x1 = +x) + ',' + (this._y1 = +y)
  }

  quadraticCurveTo(x1: number, y1: number, x: number, y: number) {
    this._ += 'Q' + (+x1) + ',' + (+y1) + ',' + (this._x1 = +x) + ',' + (this._y1 = +y)
  }

  bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    this._ += 'C' + (+x1) + ',' + (+y1) + ',' + (+x2) + ',' + (+y2) + ',' + (this._x1 = +x) + ',' + (this._y1 = +y)
  }

  arcTo(x1: number, y1: number, x2: number, y2: number, r: number) {
    x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r
    const x0 = this._x1,
      y0 = this._y1,
      x21 = x2 - x1,
      y21 = y2 - y1,
      x01 = x0 - x1,
      y01 = y0 - y1,
      l01_2 = x01 * x01 + y01 * y01

    // Is the radius negative? Error.
    if (r < 0) throw new Error('negative radius: ' + r)

    // Is this path empty? Move to (x1,y1).
    if (this._x1 === null) {
      this._ += 'M' + (this._x1 = x1) + ',' + (this._y1 = y1)
    }

    // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
    else if (!(l01_2 > epsilon)) {
      return
    }

    // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
    // Equivalently, is (x1,y1) coincident with (x2,y2)?
    // Or, is the radius zero? Line to (x1,y1).
    else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
      this._ += 'L' + (this._x1 = x1) + ',' + (this._y1 = y1)
    }

    // Otherwise, draw an arc!
    else {
      const x20 = x2 - x0,
        y20 = y2 - y0,
        l21_2 = x21 * x21 + y21 * y21,
        l20_2 = x20 * x20 + y20 * y20,
        l21 = Math.sqrt(l21_2),
        l01 = Math.sqrt(l01_2),
        l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
        t01 = l / l01,
        t21 = l / l21

      // If the start tangent is not coincident with (x0,y0), line to.
      if (Math.abs(t01 - 1) > epsilon) {
        this._ += 'L' + (x1 + t01 * x01) + ',' + (y1 + t01 * y01)
      }

      this._ += 'A' + r + ',' + r + ',0,0,' + (+(y01 * x20 > x01 * y20)) + ',' + (this._x1 = x1 + t21 * x21) + ',' + (this._y1 = y1 + t21 * y21)
    }
  }

  arc(x: number, y: number, r: number, a0: number, a1: number, ccw: boolean) {
    x = +x, y = +y, r = +r, ccw = !!ccw
    const dx = r * Math.cos(a0),
      dy = r * Math.sin(a0),
      x0 = x + dx,
      y0 = y + dy,
      cw = 1 ^ Number(ccw)
    let da = ccw ? a0 - a1 : a1 - a0

    // Is the radius negative? Error.
    if (r < 0) throw new Error('negative radius: ' + r)

    // Is this path empty? Move to (x0,y0).
    if (this._x1 === null) {
      this._ += 'M' + x0 + ',' + y0
    }

    // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
    else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
      this._ += 'L' + x0 + ',' + y0
    }

    // Is this arc empty? We’re done.
    if (!r) return

    // Does the angle go the wrong way? Flip the direction.
    if (da < 0) da = da % tau + tau

    // Is this a complete circle? Draw two arcs to complete the circle.
    if (da > tauEpsilon) {
      this._ += 'A' + r + ',' + r + ',0,1,' + cw + ',' + (x - dx) + ',' + (y - dy) + 'A' + r + ',' + r + ',0,1,' + cw + ',' + (this._x1 = x0) + ',' + (this._y1 = y0)
    }

    // Is this arc non-empty? Draw an arc!
    else if (da > epsilon) {
      this._ += 'A' + r + ',' + r + ',0,' + (+(da >= pi)) + ',' + cw + ',' + (this._x1 = x + r * Math.cos(a1)) + ',' + (this._y1 = y + r * Math.sin(a1))
    }
  }

  rect(x: number, y: number, w: number, h: number) {
    this._ += 'M' + (this._x0 = this._x1 = +x) + ',' + (this._y0 = this._y1 = +y) + 'h' + (+w) + 'v' + (+h) + 'h' + (-w) + 'Z'
  }

  toString() {
    return this._
  }

}