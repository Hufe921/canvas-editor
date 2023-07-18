import { HERSHEY } from './hershey'
import { SYMB, Symb, asciiMap } from './symbols'

const CONFIG: Record<string, number> = {
  SUB_SUP_SCALE: 0.5,
  SQRT_MAG_SCALE: 0.5,
  FRAC_SCALE: 0.85,
  LINE_SPACING: 0.5,
  FRAC_SPACING: 0.4
}

function tokenize(str: string): string[] {
  str = str.replace(/\n/g, ' ')
  let i = 0
  const tokens: string[] = []
  let curr = ''
  while (i < str.length) {
    if (str[i] == ' ') {
      if (curr.length) {
        tokens.push(curr)
        curr = ''
      }
    } else if (str[i] == '\\') {
      if (curr.length == 1 && curr[0] == '\\') {
        curr += str[i]
        tokens.push(curr)
        curr = ''
      } else {
        if (curr.length) {
          tokens.push(curr)
        }
        curr = str[i]
      }
    } else if (/[A-Za-z0-9\.]/.test(str[i])) {
      curr += str[i]
    } else {
      if (curr.length && curr != '\\') {
        tokens.push(curr)
        curr = ''
      }
      curr += str[i]
      tokens.push(curr)
      curr = ''
    }
    i++
  }
  if (curr.length) tokens.push(curr)
  return tokens
}

interface Bbox {
  x: number
  y: number
  w: number
  h: number
}

interface Expr {
  type: string
  text: string
  mode: string
  chld: Expr[]
  bbox: Bbox
}

function parseAtom(x: string): Expr {
  return {
    type: SYMB[x] ? 'symb' : 'char',
    mode: 'math',
    text: x,
    chld: [],
    // @ts-ignore
    bbox: null
  }
}

function parse(tokens: string[]): Expr {
  let i = 0
  let expr: Expr = {
    type: 'node',
    text: '',
    mode: 'math',
    chld: [],
    // @ts-ignore
    bbox: null
  }

  function takeOpt(): Expr | null {
    if (tokens[i] != '[') {
      return null
    }
    let lvl = 0
    let j = i
    while (j < tokens.length) {
      if (tokens[j] == '[') {
        lvl++
      } else if (tokens[j] == ']') {
        lvl--
        if (!lvl) {
          break
        }
      }
      j++
    }
    const ret: Expr = parse(tokens.slice(i + 1, j))
    i = j
    return ret
  }

  function takeN(n: number): Expr[] {
    let j: number = i
    let j0: number = j
    let lvl = 0
    let cnt = 0
    const ret: Expr[] = []
    while (j < tokens.length) {
      if (tokens[j] == '{') {
        if (!lvl) {
          j0 = j
        }
        lvl++
      } else if (tokens[j] == '}') {
        lvl--
        if (!lvl) {
          ret.push(parse(tokens.slice(j0 + 1, j)))
          cnt++
          if (cnt == n) {
            break
          }
        }
      } else {
        if (lvl == 0) {
          ret.push(parseAtom(tokens[j]))
          cnt++
          if (cnt == n) {
            break
          }
        }
      }
      j++
    }
    i = j
    return ret
  }

  for (i = 0; i < tokens.length; i++) {
    const s: Symb = SYMB[tokens[i]]
    const e: Expr = {
      type: '',
      text: tokens[i],
      mode: 'math',
      chld: [],
      // @ts-ignore
      bbox: null
    }
    if (s) {
      if (s.arity) {
        i++
        e.type = 'func'
        let opt: Expr | null = null
        if (s.flags.opt) {
          opt = takeOpt()
          if (opt) i++
        }
        const chld: Expr[] = takeN(s.arity)
        e.chld = chld
        if (opt) {
          e.chld.push(opt)
        }
      } else {
        e.type = 'symb'
      }
    } else {
      if (tokens[i] == '{') {
        e.type = 'node'
        e.text = ''
        e.chld = takeN(1)
      } else {
        e.type = 'char'
      }
    }
    expr.chld.push(e)
  }
  if (expr.chld.length == 1) {
    expr = expr.chld[0]
  }
  return expr
}

function environments(exprs: Expr[]) {
  let i = 0
  while (i < exprs.length) {
    if (exprs[i].text == '\\begin') {
      let j: number
      for (j = i; j < exprs.length; j++) {
        if (exprs[j].text == '\\end') {
          break
        }
      }
      const es: Expr[] = exprs.splice(i + 1, j - (i + 1))
      environments(es)
      exprs[i].text = exprs[i].chld[0].text
      exprs[i].chld = es
      exprs.splice(i + 1, 1)
    }
    i++
  }
}

function transform(
  expr: Expr,
  sclx: number,
  scly: number,
  x: number,
  y: number,
  notFirst?: boolean
) {
  if (scly == null) {
    scly = sclx
  }
  if (!expr.bbox) return
  if (notFirst) {
    expr.bbox.x *= sclx
    expr.bbox.y *= scly
  }
  expr.bbox.w *= sclx
  expr.bbox.h *= scly
  for (let i = 0; i < expr.chld.length; i++) {
    transform(expr.chld[i], sclx, scly, 0, 0, true)
  }
  expr.bbox.x += x
  expr.bbox.y += y
}

function computeBbox(exprs: Expr[]): Bbox {
  let xmin = Infinity
  let xmax = -Infinity
  let ymin = Infinity
  let ymax = -Infinity
  for (let i = 0; i < exprs.length; i++) {
    if (!exprs[i].bbox) {
      continue
    }
    xmin = Math.min(xmin, exprs[i].bbox.x)
    ymin = Math.min(ymin, exprs[i].bbox.y)
    xmax = Math.max(xmax, exprs[i].bbox.x + exprs[i].bbox.w)
    ymax = Math.max(ymax, exprs[i].bbox.y + exprs[i].bbox.h)
  }
  return { x: xmin, y: ymin, w: xmax - xmin, h: ymax - ymin }
}

function group(exprs: Expr[]): Expr {
  if (!exprs.length) {
    // @ts-ignore
    return null
  }
  const bbox: Bbox = computeBbox(exprs)
  // console.log(exprs,bbox);
  for (let i = 0; i < exprs.length; i++) {
    if (!exprs[i].bbox) {
      continue
    }
    exprs[i].bbox.x -= bbox.x
    exprs[i].bbox.y -= bbox.y
  }
  const expr: Expr = {
    type: 'node',
    text: '',
    mode: 'math',
    chld: exprs,
    bbox
  }
  return expr
}

function align(exprs: Expr[], alignment = 'center'): void {
  for (let i = 0; i < exprs.length; i++) {
    if (exprs[i].text == '^' || exprs[i].text == '\'') {
      let h = 0
      let j = i
      while (
        j > 0 &&
        (exprs[j].text == '^' || exprs[j].text == '_' || exprs[j].text == '\'')
      ) {
        j--
      }
      h = exprs[j].bbox.y
      if (exprs[i].text == '\'') {
        exprs[i].bbox.y = h
      } else {
        // @ts-ignore
        transform(exprs[i], CONFIG.SUB_SUP_SCALE, null, 0, 0)
        if (SYMB[exprs[j].text] && SYMB[exprs[j].text].flags.big) {
          exprs[i].bbox.y = h - exprs[i].bbox.h
        } else if (exprs[j].text == '\\int') {
          exprs[i].bbox.y = h
        } else {
          exprs[i].bbox.y = h - exprs[i].bbox.h / 2
        }
      }
    } else if (exprs[i].text == '_') {
      let h = 1
      let j = i
      while (
        j > 0 &&
        (exprs[j].text == '^' || exprs[j].text == '_' || exprs[j].text == '\'')
      ) {
        j--
      }
      h = exprs[j].bbox.y + exprs[j].bbox.h
      // @ts-ignore
      transform(exprs[i], CONFIG.SUB_SUP_SCALE, null, 0, 0)
      if (SYMB[exprs[j].text] && SYMB[exprs[j].text].flags.big) {
        exprs[i].bbox.y = h
      } else if (exprs[j].text == '\\int') {
        exprs[i].bbox.y = h - exprs[i].bbox.h
      } else {
        exprs[i].bbox.y = h - exprs[i].bbox.h / 2
      }
    }
  }
  function searchHigh(
    i: number,
    l: string,
    r: string,
    dir: number,
    lvl0: number
  ): number[] {
    let j = i
    let lvl = lvl0
    let ymin = Infinity
    let ymax = -Infinity
    while (dir > 0 ? j < exprs.length : j >= 0) {
      if (exprs[j].text == l) {
        lvl++
      } else if (exprs[j].text == r) {
        lvl--
        if (lvl == 0) {
          break
        }
      } else if (exprs[j].text == '^' || exprs[j].text == '_') {
        //skip
      } else if (exprs[j].bbox) {
        ymin = Math.min(ymin, exprs[j].bbox.y)
        ymax = Math.max(ymax, exprs[j].bbox.y + exprs[j].bbox.h)
      }
      j += dir
    }
    return [ymin, ymax]
  }
  for (let i = 0; i < exprs.length; i++) {
    if (exprs[i].text == '\\left') {
      const [ymin, ymax] = searchHigh(i, '\\left', '\\right', 1, 0)
      if (ymin != Infinity && ymax != -Infinity) {
        exprs[i].bbox.y = ymin
        transform(exprs[i], 1, (ymax - ymin) / exprs[i].bbox.h, 0, 0)
      }
    } else if (exprs[i].text == '\\right') {
      const [ymin, ymax] = searchHigh(i, '\\right', '\\left', -1, 0)
      if (ymin != Infinity && ymax != -Infinity) {
        exprs[i].bbox.y = ymin
        transform(exprs[i], 1, (ymax - ymin) / exprs[i].bbox.h, 0, 0)
      }
    } else if (exprs[i].text == '\\middle') {
      const [lmin, lmax] = searchHigh(i, '\\right', '\\left', -1, 1)
      const [rmin, rmax] = searchHigh(i, '\\left', '\\right', 1, 1)
      const ymin = Math.min(lmin, rmin)
      const ymax = Math.max(lmax, rmax)
      if (ymin != Infinity && ymax != -Infinity) {
        exprs[i].bbox.y = ymin
        transform(exprs[i], 1, (ymax - ymin) / exprs[i].bbox.h, 0, 0)
      }
    }
  }

  if (!exprs.some(x => x.text == '&' || x.text == '\\\\')) {
    return
  }

  const rows: Expr[][][] = []
  let row: Expr[][] = []
  let cell: Expr[] = []

  for (let i = 0; i < exprs.length; i++) {
    if (exprs[i].text == '&') {
      row.push(cell)
      cell = []
    } else if (exprs[i].text == '\\\\') {
      if (cell.length) {
        row.push(cell)
        cell = []
      }
      rows.push(row)
      row = []
    } else {
      cell.push(exprs[i])
    }
  }
  if (cell.length) {
    row.push(cell)
  }
  if (row.length) {
    rows.push(row)
  }
  const colws: number[] = []
  const erows: Expr[][] = []
  for (let i = 0; i < rows.length; i++) {
    const erow: Expr[] = []
    for (let j = 0; j < rows[i].length; j++) {
      const e: Expr = group(rows[i][j])
      if (e) {
        colws[j] = colws[j] || 0
        colws[j] = Math.max(e.bbox.w + 1, colws[j])
      }
      erow[j] = e
    }
    erows.push(erow)
  }

  const ybds: number[][] = []
  for (let i = 0; i < erows.length; i++) {
    let ymin = Infinity
    let ymax = -Infinity
    for (let j = 0; j < erows[i].length; j++) {
      if (!erows[i][j]) {
        continue
      }
      ymin = Math.min(ymin, erows[i][j].bbox.y)
      ymax = Math.max(ymax, erows[i][j].bbox.y + erows[i][j].bbox.h)
    }
    ybds.push([ymin, ymax])
  }

  for (let i = 0; i < ybds.length; i++) {
    if (ybds[i][0] == Infinity || ybds[i][1] == Infinity) {
      ybds[i][0] = i == 0 ? 0 : ybds[i - 1][1]
      ybds[i][1] = ybds[i][0] + 2
    }
  }

  for (let i = 1; i < erows.length; i++) {
    const shft = ybds[i - 1][1] - ybds[i][0] + CONFIG.LINE_SPACING
    for (let j = 0; j < erows[i].length; j++) {
      if (erows[i][j]) {
        erows[i][j].bbox.y += shft
      }
    }
    ybds[i][0] += shft
    ybds[i][1] += shft
  }

  exprs.splice(0, exprs.length)
  for (let i = 0; i < erows.length; i++) {
    let dx = 0
    for (let j = 0; j < erows[i].length; j++) {
      const e: Expr = erows[i][j]
      if (!e) {
        dx += colws[j]
        continue
      }
      e.bbox.x += dx
      dx += colws[j] - e.bbox.w
      // e.bbox.w = colws[j];
      if (alignment == 'center') {
        e.bbox.x += (colws[j] - e.bbox.w) / 2
      } else if (alignment == 'left') {
        //ok
      } else if (alignment == 'right') {
        e.bbox.x += colws[j] - e.bbox.w
      } else if (alignment == 'equation') {
        if (j != erows[i].length - 1) {
          e.bbox.x += colws[j] - e.bbox.w
        }
      }
      exprs.push(e)
    }
  }
}

function plan(expr: Expr, mode = 'math'): void {
  const tmd: string =
    {
      '\\text': 'text',
      '\\mathnormal': 'math',
      '\\mathrm': 'rm',
      '\\mathit': 'it',
      '\\mathbf': 'bf',
      '\\mathsf': 'sf',
      '\\mathtt': 'tt',
      '\\mathfrak': 'frak',
      '\\mathcal': 'cal',
      '\\mathbb': 'bb',
      '\\mathscr': 'scr',
      '\\rm': 'rm',
      '\\it': 'it',
      '\\bf': 'bf',
      '\\sf': 'tt',
      '\\tt': 'tt',
      '\\frak': 'frak',
      '\\cal': 'cal',
      '\\bb': 'bb',
      '\\scr': 'scr'
    }[expr.text] ?? mode
  if (!expr.chld.length) {
    if (SYMB[expr.text]) {
      if (SYMB[expr.text].flags.big) {
        if (expr.text == '\\lim') {
          expr.bbox = { x: 0, y: 0, w: 3.5, h: 2 }
        } else {
          expr.bbox = { x: 0, y: -0.5, w: 3, h: 3 }
        }
      } else if (SYMB[expr.text].flags.txt) {
        let w = 0
        for (let i = 1; i < expr.text.length; i++) {
          w += HERSHEY(asciiMap(expr.text[i], 'text')).w
        }
        w /= 16
        expr.bbox = { x: 0, y: 0, w: w, h: 2 }
      } else if (SYMB[expr.text].glyph) {
        let w = HERSHEY(SYMB[expr.text].glyph).w
        w /= 16
        if (expr.text == '\\int' || expr.text == '\\oint') {
          expr.bbox = { x: 0, y: -1.5, w: w, h: 5 }
        } else {
          expr.bbox = { x: 0, y: 0, w: w, h: 2 }
        }
      } else {
        expr.bbox = { x: 0, y: 0, w: 1, h: 2 }
      }
    } else {
      let w = 0
      for (let i = 0; i < expr.text.length; i++) {
        if (!HERSHEY(asciiMap(expr.text[i], tmd))) {
          continue
        }
        if (tmd == 'tt') {
          w += 16
        } else {
          w += HERSHEY(asciiMap(expr.text[i], tmd)).w
        }
      }
      w /= 16
      expr.bbox = { x: 0, y: 0, w: w, h: 2 }
    }
    expr.mode = tmd
    return
  }
  if (expr.text == '\\frac') {
    const a: Expr = expr.chld[0]
    const b: Expr = expr.chld[1]
    const s: number = CONFIG.FRAC_SCALE
    plan(a)
    plan(b)
    a.bbox.x = 0
    a.bbox.y = 0
    b.bbox.x = 0
    b.bbox.y = 0
    const mw: number = Math.max(a.bbox.w, b.bbox.w) * s
    // @ts-ignore
    transform(a, s, null, (mw - a.bbox.w * s) / 2, 0)
    transform(
      b,
      s,
      // @ts-ignore
      null,
      (mw - b.bbox.w * s) / 2,
      a.bbox.h + CONFIG.FRAC_SPACING
    )
    expr.bbox = {
      x: 0,
      y: -a.bbox.h + 1 - CONFIG.FRAC_SPACING / 2,
      w: mw,
      h: a.bbox.h + b.bbox.h + CONFIG.FRAC_SPACING
    }
  } else if (expr.text == '\\binom') {
    const a: Expr = expr.chld[0]
    const b: Expr = expr.chld[1]
    plan(a)
    plan(b)
    a.bbox.x = 0
    a.bbox.y = 0
    b.bbox.x = 0
    b.bbox.y = 0
    const mw: number = Math.max(a.bbox.w, b.bbox.w)
    // @ts-ignore
    transform(a, 1, null, (mw - a.bbox.w) / 2 + 1, 0)
    // @ts-ignore
    transform(b, 1, null, (mw - b.bbox.w) / 2 + 1, a.bbox.h)
    expr.bbox = { x: 0, y: -a.bbox.h + 1, w: mw + 2, h: a.bbox.h + b.bbox.h }
  } else if (expr.text == '\\sqrt') {
    const e: Expr = expr.chld[0]
    plan(e)
    const f: Expr = expr.chld[1]
    let pl = 0
    if (f) {
      plan(f)
      pl = Math.max(f.bbox.w * CONFIG.SQRT_MAG_SCALE - 0.5, 0)
      // @ts-ignore
      transform(f, CONFIG.SQRT_MAG_SCALE, null, 0, 0.5)
    }
    // @ts-ignore
    transform(e, 1, null, 1 + pl, 0.5)
    expr.bbox = {
      x: 0,
      y: 2 - e.bbox.h - 0.5,
      w: e.bbox.w + 1 + pl,
      h: e.bbox.h + 0.5
    }
  } else if (SYMB[expr.text] && SYMB[expr.text].flags.hat) {
    const e: Expr = expr.chld[0]
    plan(e)
    const y0 = e.bbox.y - 0.5
    e.bbox.y = 0.5
    expr.bbox = { x: 0, y: y0, w: e.bbox.w, h: e.bbox.h + 0.5 }
  } else if (SYMB[expr.text] && SYMB[expr.text].flags.mat) {
    const e: Expr = expr.chld[0]
    plan(e)
    expr.bbox = { x: 0, y: 0, w: e.bbox.w, h: e.bbox.h + 0.5 }
  } else {
    let dx = 0
    let dy = 0
    let mh = 1
    for (let i = 0; i < expr.chld.length; i++) {
      const c: Expr = expr.chld[i]
      // @ts-ignore
      const spac: number =
        {
          '\\quad': 2,
          '\\,': (2 * 3) / 18,
          '\\:': (2 * 4) / 18,
          '\\;': (2 * 5) / 18,
          '\\!': (2 * -3) / 18
        }[c.text] ?? null

      if (c.text == '\\\\') {
        dy += mh
        dx = 0
        mh = 1
        continue
      } else if (c.text == '&') {
        continue
      } else if (spac != null) {
        dx += spac
        continue
      } else {
        plan(c, tmd)
        // @ts-ignore
        transform(c, 1, null, dx, dy)
        if (c.text == '^' || c.text == '_' || c.text == '\'') {
          let j: number = i
          while (
            j > 0 &&
            (expr.chld[j].text == '^' ||
              expr.chld[j].text == '_' ||
              expr.chld[j].text == '\'')
          ) {
            j--
          }
          const wasBig =
            SYMB[expr.chld[j].text] && SYMB[expr.chld[j].text].flags.big
          if (c.text == '\'') {
            let k = j + 1
            let nth = 0
            while (k < i) {
              if (expr.chld[k].text == '\'') {
                nth++
              }
              k++
            }
            c.bbox.x =
              expr.chld[j].bbox.x + expr.chld[j].bbox.w + c.bbox.w * nth
            dx = Math.max(dx, c.bbox.x + c.bbox.w)
          } else {
            if (wasBig) {
              const ex =
                expr.chld[j].bbox.x +
                (expr.chld[j].bbox.w - c.bbox.w * CONFIG.SUB_SUP_SCALE) / 2
              c.bbox.x = ex
              dx = Math.max(
                dx,
                expr.chld[j].bbox.x +
                  expr.chld[j].bbox.w +
                  (c.bbox.w * CONFIG.SUB_SUP_SCALE - expr.chld[j].bbox.w) / 2
              )
            } else {
              c.bbox.x = expr.chld[j].bbox.x + expr.chld[j].bbox.w
              dx = Math.max(dx, c.bbox.x + c.bbox.w * CONFIG.SUB_SUP_SCALE)
            }
          }
        } else {
          dx += c.bbox.w
        }
        if (mode == 'text') {
          dx += 1
        }
        mh = Math.max(c.bbox.y + c.bbox.h - dy, mh)
      }
    }
    dy += mh
    const m2s: Record<string, string[]> = {
      bmatrix: ['[', ']'],
      pmatrix: ['(', ')'],
      Bmatrix: ['\\{', '\\}'],
      cases: ['\\{']
    }
    const alt: string =
      {
        bmatrix: 'center',
        pmatrix: 'center',
        Bmatrix: 'center',
        cases: 'left',
        matrix: 'center',
        aligned: 'equation'
      }[expr.text] ?? 'left'

    const hasLp = !!m2s[expr.text]
    const hasRp = !!m2s[expr.text] && m2s[expr.text].length > 1

    align(expr.chld, alt)
    const bb = computeBbox(expr.chld)
    if (expr.text == '\\text') {
      bb.x -= 1
      bb.w += 2
    }

    for (let i = 0; i < expr.chld.length; i++) {
      // @ts-ignore
      transform(expr.chld[i], 1, null, -bb.x + (hasLp ? 1.5 : 0), -bb.y)
    }
    expr.bbox = {
      x: 0,
      y: 0,
      w: bb.w + 1.5 * Number(hasLp) + 1.5 * Number(hasRp),
      h: bb.h
    }

    if (hasLp) {
      expr.chld.unshift({
        type: 'symb',
        text: m2s[expr.text][0],
        mode: expr.mode,
        chld: [],
        bbox: { x: 0, y: 0, w: 1, h: bb.h }
      })
    }
    if (hasRp) {
      expr.chld.push({
        type: 'symb',
        text: m2s[expr.text][1],
        mode: expr.mode,
        chld: [],
        bbox: { x: bb.w + 2, y: 0, w: 1, h: bb.h }
      })
    }
    if (hasLp || hasRp || expr.text == 'matrix') {
      expr.type = 'node'
      expr.text = ''
      expr.bbox.y -= (expr.bbox.h - 2) / 2
    }
  }
}

function flatten(expr: Expr) {
  function flat(expr: Expr, dx: number, dy: number): Expr[] {
    const ff: Expr[] = []
    if (expr.bbox) {
      dx += expr.bbox.x
      dy += expr.bbox.y
      if (expr.text == '\\frac') {
        const h: number =
          expr.chld[1].bbox.y - (expr.chld[0].bbox.y + expr.chld[0].bbox.h)
        const e: Expr = {
          type: 'symb',
          mode: expr.mode,
          text: '\\bar',
          bbox: {
            x: dx,
            y: dy + (expr.chld[1].bbox.y - h / 2) - h / 2,
            w: expr.bbox.w,
            h: h
          },
          chld: []
        }
        ff.push(e)
      } else if (expr.text == '\\sqrt') {
        const h: number = expr.chld[0].bbox.y
        const xx: number = Math.max(
          0,
          expr.chld[0].bbox.x - expr.chld[0].bbox.h / 2
        )
        const e: Expr = {
          type: 'symb',
          mode: expr.mode,
          text: '\\sqrt',
          bbox: {
            x: dx + xx,
            y: dy + h / 2,
            w: expr.chld[0].bbox.x - xx,
            h: expr.bbox.h - h / 2
          },
          chld: []
        }
        ff.push(e)
        ff.push({
          type: 'symb',
          text: '\\bar',
          mode: expr.mode,
          bbox: {
            x: dx + expr.chld[0].bbox.x,
            y: dy,
            w: expr.bbox.w - expr.chld[0].bbox.x,
            h: h
          },
          chld: []
        })
      } else if (expr.text == '\\binom') {
        const w = Math.min(expr.chld[0].bbox.x, expr.chld[1].bbox.x)
        const e: Expr = {
          type: 'symb',
          mode: expr.mode,
          text: '(',
          bbox: {
            x: dx,
            y: dy,
            w: w,
            h: expr.bbox.h
          },
          chld: []
        }
        ff.push(e)
        ff.push({
          type: 'symb',
          text: ')',
          mode: expr.mode,
          bbox: {
            x: dx + expr.bbox.w - w,
            y: dy,
            w: w,
            h: expr.bbox.h
          },
          chld: []
        })
      } else if (SYMB[expr.text] && SYMB[expr.text].flags.hat) {
        const h: number = expr.chld[0].bbox.y
        const e: Expr = {
          type: 'symb',
          mode: expr.mode,
          text: expr.text,
          bbox: {
            x: dx,
            y: dy,
            w: expr.bbox.w,
            h: h
          },
          chld: []
        }
        ff.push(e)
      } else if (SYMB[expr.text] && SYMB[expr.text].flags.mat) {
        const h: number = expr.chld[0].bbox.h
        const e: Expr = {
          type: 'symb',
          text: expr.text,
          mode: expr.mode,
          bbox: {
            x: dx,
            y: dy + h,
            w: expr.bbox.w,
            h: expr.bbox.h - h
          },
          chld: []
        }
        ff.push(e)
      } else if (expr.type != 'node' && expr.text != '^' && expr.text != '_') {
        const e: Expr = {
          type: expr.type == 'func' ? 'symb' : expr.type,
          text: expr.text,
          mode: expr.mode,
          bbox: {
            x: dx,
            y: dy,
            w: expr.bbox.w,
            h: expr.bbox.h
          },
          chld: []
        }
        ff.push(e)
      }
    }
    for (let i = 0; i < expr.chld.length; i++) {
      const f = flat(expr.chld[i], dx, dy)
      ff.push(...f)
    }
    return ff
  }
  const f = flat(expr, -expr.bbox.x, -expr.bbox.y)
  expr.type = 'node'
  expr.text = ''
  expr.chld = f
}

function render(expr: Expr): number[][][] {
  const o: number[][][] = []
  for (let i = 0; i < expr.chld.length; i++) {
    const e: Expr = expr.chld[i]
    let s = e.bbox.h / 2
    let isSmallHat = false
    if (
      SYMB[e.text] &&
      SYMB[e.text].flags.hat &&
      !SYMB[e.text].flags.xfl &&
      !SYMB[e.text].flags.yfl
    ) {
      s *= 4
      isSmallHat = true
    }
    if (SYMB[e.text] && SYMB[e.text].glyph) {
      const d = HERSHEY(SYMB[e.text].glyph)
      for (let j = 0; j < d.polylines.length; j++) {
        const l: number[][] = []

        for (let k = 0; k < d.polylines[j].length; k++) {
          let x = d.polylines[j][k][0]
          let y = d.polylines[j][k][1]

          if (SYMB[e.text].flags.xfl) {
            x = ((x - d.xmin) / Math.max(d.xmax - d.xmin, 1)) * e.bbox.w
            x += e.bbox.x
          } else if ((d.w / 16) * s > e.bbox.w) {
            x = (x / Math.max(d.w, 1)) * e.bbox.w
            x += e.bbox.x
          } else {
            x = (x / 16) * s
            const p = (e.bbox.w - (d.w / 16) * s) / 2
            x += e.bbox.x + p
          }
          if (SYMB[e.text].flags.yfl) {
            y = ((y - d.ymin) / Math.max(d.ymax - d.ymin, 1)) * e.bbox.h
            y += e.bbox.y
          } else {
            y = (y / 16) * s
            if (isSmallHat) {
              const p = (d.ymax + d.ymin) / 2
              y -= (p / 16) * s
            }
            y += e.bbox.y + e.bbox.h / 2
          }
          l.push([x, y])
        }
        o.push(l)
      }
    } else if ((SYMB[e.text] && SYMB[e.text].flags.txt) || e.type == 'char') {
      let x0 = e.bbox.x
      const isVerb = !!(SYMB[e.text] && SYMB[e.text].flags.txt)
      for (let n = Number(isVerb); n < e.text.length; n++) {
        const d = HERSHEY(asciiMap(e.text[n], isVerb ? 'text' : e.mode))
        if (!d) {
          console.warn('unmapped character: ' + e.text[n])
          continue
        }
        for (let j = 0; j < d.polylines.length; j++) {
          const l: number[][] = []
          for (let k = 0; k < d.polylines[j].length; k++) {
            let x = d.polylines[j][k][0]
            let y = d.polylines[j][k][1]
            x /= 16
            y /= 16
            x *= s
            y *= s
            if (e.mode == 'tt') {
              if (d.w > 16) {
                x *= 16 / d.w
              } else {
                x += (16 - d.w) / 2 / 16
              }
            }
            x += x0
            y += e.bbox.y + e.bbox.h / 2
            l.push([x, y])
          }
          o.push(l)
        }
        if (e.mode == 'tt') {
          x0 += s
        } else {
          x0 += (d.w / 16) * s
        }
      }
    }
  }
  return o
}

interface ExportOpt {
  MIN_CHAR_H?: number
  MAX_W?: number
  MAX_H?: number
  MARGIN_X?: number
  MARGIN_Y?: number
  SCALE_X?: number
  SCALE_Y?: number
  STROKE_W?: number
  FG_COLOR?: string
  BG_COLOR?: string
}

function nf(x: number): number {
  return Math.round(x * 100) / 100
}

export interface LaTexSVG {
  svg: string
  width: number
  height: number
}

export class LaTexUtils {
  _latex: string
  _tree: Expr
  _tokens: string[]
  _polylines: number[][][]

  constructor(latex: string) {
    this._latex = latex
    this._tokens = tokenize(latex)
    this._tree = parse(this._tokens)
    environments(this._tree.chld)
    plan(this._tree)
    flatten(this._tree)
    this._polylines = render(this._tree)
  }

  private resolveScale(opt?: ExportOpt): number[] {
    if (opt == undefined) {
      return [16, 16, 16, 16]
    }
    let sclx: number = opt.SCALE_X ?? 16
    let scly: number = opt.SCALE_Y ?? 16

    if (opt.MIN_CHAR_H != undefined) {
      let mh = 0
      for (let i = 0; i < this._tree.chld.length; i++) {
        const c: Expr = this._tree.chld[i]
        if (
          c.type == 'char' ||
          (SYMB[c.text] &&
            (SYMB[c.text].flags.txt || !Object.keys(SYMB[c.text].flags).length))
        ) {
          mh = Math.min(c.bbox.h, mh)
        }
      }
      const s: number = Math.max(1, opt.MIN_CHAR_H / mh)
      sclx *= s
      scly *= s
    }
    if (opt.MAX_W != undefined) {
      const s0 = sclx
      sclx = Math.min(sclx, opt.MAX_W / this._tree.bbox.w)
      scly *= sclx / s0
    }
    if (opt.MAX_H != undefined) {
      const s0 = scly
      scly = Math.min(scly, opt.MAX_H / this._tree.bbox.h)
      sclx *= scly / s0
    }
    const px: number = opt.MARGIN_X ?? sclx
    const py: number = opt.MARGIN_Y ?? scly
    return [px, py, sclx, scly]
  }

  polylines(opt?: ExportOpt): number[][][] {
    if (!opt) opt = {}
    const polylines: number[][][] = []
    const [px, py, sclx, scly] = this.resolveScale(opt)
    for (let i = 0; i < this._polylines.length; i++) {
      polylines.push([])
      for (let j = 0; j < this._polylines[i].length; j++) {
        const [x, y] = this._polylines[i][j]
        polylines[polylines.length - 1].push([px + x * sclx, py + y * scly])
      }
    }
    return polylines
  }

  pathd(opt?: ExportOpt): string {
    if (!opt) opt = {}
    let d = ''
    const [px, py, sclx, scly] = this.resolveScale(opt)
    for (let i = 0; i < this._polylines.length; i++) {
      for (let j = 0; j < this._polylines[i].length; j++) {
        const [x, y] = this._polylines[i][j]
        d += !j ? 'M' : 'L'
        d += `${nf(px + x * sclx)} ${nf(py + y * scly)}`
      }
    }
    return d
  }

  svg(opt: ExportOpt): LaTexSVG {
    if (!opt) opt = {}
    const [px, py, sclx, scly] = this.resolveScale(opt)
    const w = nf(this._tree.bbox.w * sclx + px * 2)
    const h = nf(this._tree.bbox.h * scly + py * 2)
    let o = `<svg
      xmlns="http://www.w3.org/2000/svg"
      width="${w}" height="${h}"
      fill="none" stroke="${opt.FG_COLOR ?? 'black'}" stroke-width="${
      opt.STROKE_W ?? 1
    }"
      stroke-linecap="round" stroke-linejoin="round"
    >`
    if (opt.BG_COLOR) {
      o += `<rect x="${0}" y="${0}" width="${w}" height="${h}" fill="${
        opt.BG_COLOR
      }" stroke="none"></rect>`
    }
    o += `<path d="`
    for (let i = 0; i < this._polylines.length; i++) {
      o += 'M'
      for (let j = 0; j < this._polylines[i].length; j++) {
        const [x, y] = this._polylines[i][j]
        o += nf(px + x * sclx) + ' ' + nf(py + y * scly) + ' '
      }
    }
    o += `"/>`
    o += `</svg>`
    return {
      svg: `data:image/svg+xml;base64,${window.btoa(o)}`,
      width: Math.ceil(w),
      height: Math.ceil(h)
    }
  }

  pdf(opt: ExportOpt): string {
    if (!opt) opt = {}
    const [px, py, sclx, scly] = this.resolveScale(opt)

    const width = nf(this._tree.bbox.w * sclx + px * 2)
    const height = nf(this._tree.bbox.h * scly + py * 2)
    let head = `%PDF-1.1\n%%¥±ë\n1 0 obj\n<< /Type /Catalog\n/Pages 2 0 R\n>>endobj
    2 0 obj\n<< /Type /Pages\n/Kids [3 0 R]\n/Count 1\n/MediaBox [0 0 ${width} ${height}]\n>>\nendobj
    3 0 obj\n<< /Type /Page\n/Parent 2 0 R\n/Resources\n<< /Font\n<< /F1\n<< /Type /Font
    /Subtype /Type1\n/BaseFont /Times-Roman\n>>\n>>\n>>\n/Contents [`
    let pdf = ''
    let count = 4
    for (let i = 0; i < this._polylines.length; i++) {
      pdf += `${count} 0 obj \n<< /Length 0 >>\n stream\n 1 j 1 J ${
        opt.STROKE_W ?? 1
      } w\n`
      for (let j = 0; j < this._polylines[i].length; j++) {
        const [x, y] = this._polylines[i][j]
        pdf += `${nf(px + x * sclx)} ${nf(height - (py + y * scly))} ${
          j ? 'l' : 'm'
        } `
      }
      pdf += '\nS\nendstream\nendobj\n'
      head += `${count} 0 R `
      count++
    }
    head += ']\n>>\nendobj\n'
    pdf += '\ntrailer\n<< /Root 1 0 R \n /Size 0\n >>startxref\n\n%%EOF\n'
    return head + pdf
  }

  boxes(opt: ExportOpt): Bbox[] {
    if (!opt) opt = {}
    const [px, py, sclx, scly] = this.resolveScale(opt)
    const bs: Bbox[] = []
    for (let i = 0; i < this._tree.chld.length; i++) {
      const { x, y, w, h } = this._tree.chld[i].bbox
      bs.push({ x: px + x * sclx, y: py + y * scly, w: w * sclx, h: h * scly })
    }
    return bs
  }

  box(opt: ExportOpt): Bbox {
    if (!opt) opt = {}
    const [px, py, sclx, scly] = this.resolveScale(opt)
    return {
      x: px + this._tree.bbox.x * sclx,
      y: py + this._tree.bbox.y * scly,
      w: this._tree.bbox.w * sclx,
      h: this._tree.bbox.h * scly
    }
  }
}

const _impl: Record<string, Function> = {
  tokenize,
  parse,
  environments,
  plan,
  flatten,
  render
}

export { CONFIG, _impl }
