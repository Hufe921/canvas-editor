/** 将像素值 (px) 转换为 Word 的 Twip 单位 */
export function pxToTwip(px: number): number {
  return Math.round(px * 14.4)
}

/** 将像素值 (px) 转换为 Word 的半磅单位（用于字号） */
export function pxToHalfPoint(px: number): number {
  return Math.round(px * 1.5)
}

/** 标准化颜色值，转为不带 '#' 的大写 6 位十六进制字符 */
export function normalizeColor(color?: string): string | undefined {
  if (!color) return undefined
  const c = color.trim()
  if (/^#[0-9a-f]{3}$/i.test(c)) {
    return c
      .slice(1)
      .split('')
      .map(v => `${v}${v}`)
      .join('')
      .toUpperCase()
  }
  if (/^#[0-9a-f]{6}$/i.test(c)) {
    return c.slice(1).toUpperCase()
  }
  const m = c.match(
    /^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*[\d.]+)?\)$/i
  )
  if (!m) return undefined
  return m
    .slice(1, 4)
    .map(v =>
      Math.max(0, Math.min(255, Number(v)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')
    .toUpperCase()
}

/** 获取边框颜色，未定义时返回纯黑色 */
export function getBorderColor(color?: string): string {
  return normalizeColor(color) || '000000'
}

/** 获取文本颜色 */
export function getTextColor(color?: string): string | undefined {
  return normalizeColor(color)
}

/** 剥离 Base64 图片数据的 Data URI 前缀 */
export function stripBase64Prefix(data: string): string {
  return data.replace(/^data:image\/[^;]+;base64,/, '')
}

export function saveAs(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = window.URL.createObjectURL(blob)
  a.download = name
  a.click()
  window.URL.revokeObjectURL(a.href)
}

export function deepClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj)
  }
  if (!obj || typeof obj !== 'object') {
    return obj
  }
  let newObj = {} as T
  if (Array.isArray(obj)) {
    newObj = obj.map(item => deepClone(item)) as T
  } else {
    // prettier-ignore
    const list = Object.keys(obj) as (keyof T)[]
    list.forEach(key => {
      newObj[key] = deepClone(obj[key])
    })
  }
  return newObj
}
