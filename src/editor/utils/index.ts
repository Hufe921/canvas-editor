import { UNICODE_SYMBOL_REG } from '../dataset/constant/Regular'

export function debounce(func: Function, delay: number) {
  let timer: number
  return function (this: any, ...args: any[]) {
    if (timer) {
      window.clearTimeout(timer)
    }
    timer = window.setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}

export function throttle(func: Function, delay: number) {
  let lastExecTime = 0
  let timer: number
  return function (this: any, ...args: any[]) {
    const currentTime = Date.now()
    if (currentTime - lastExecTime >= delay) {
      window.clearTimeout(timer)
      func.apply(this, args)
      lastExecTime = currentTime
    } else {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        func.apply(this, args)
        lastExecTime = currentTime
      }, delay)
    }
  }
}

export function deepCloneOmitKeys<T, K>(obj: T, omitKeys: (keyof K)[]): T {
  if (!obj || typeof obj !== 'object') {
    return obj
  }
  let newObj: any = {}
  if (Array.isArray(obj)) {
    newObj = obj.map(item => deepCloneOmitKeys(item, omitKeys))
  } else {
    // prettier-ignore
    (Object.keys(obj) as (keyof K)[]).forEach(key => {
      if (omitKeys.includes(key)) return
      return (newObj[key] = deepCloneOmitKeys((obj[key as unknown as keyof T] ), omitKeys))
    })
  }
  return newObj
}

export function deepClone<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj
  }
  let newObj: any = {}
  if (Array.isArray(obj)) {
    newObj = obj.map(item => deepClone(item))
  } else {
    // prettier-ignore
    (Object.keys(obj) as (keyof T)[]).forEach(key => {
      return (newObj[key] = deepClone(obj[key]))
    })
  }
  return newObj
}

export function isBody(node: Element): boolean {
  return node && node.nodeType === 1 && node.tagName.toLowerCase() === 'body'
}

export function findParent(
  node: Element,
  filterFn: Function,
  includeSelf: boolean
) {
  if (node && !isBody(node)) {
    node = includeSelf ? node : (node.parentNode as Element)
    while (node) {
      if (!filterFn || filterFn(node) || isBody(node)) {
        return filterFn && !filterFn(node) && isBody(node) ? null : node
      }
      node = node.parentNode as Element
    }
  }
  return null
}

export function getUUID(): string {
  function S4(): string {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
  }
  return (
    S4() +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    '-' +
    S4() +
    S4() +
    S4()
  )
}

export function splitText(text: string): string[] {
  const data: string[] = []
  const symbolMap = new Map<number, string>()
  for (const match of text.matchAll(UNICODE_SYMBOL_REG)) {
    symbolMap.set(match.index!, match[0])
  }
  let t = 0
  while (t < text.length) {
    const symbol = symbolMap.get(t)
    if (symbol) {
      data.push(symbol)
      t += symbol.length
    } else {
      data.push(text[t])
      t++
    }
  }
  return data
}

export function downloadFile(href: string, fileName: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = fileName
  a.click()
}

export function threeClick(dom: HTMLElement, fn: (evt: MouseEvent) => any) {
  nClickEvent(3, dom, fn)
}

function nClickEvent(
  n: number,
  dom: HTMLElement,
  fn: (evt: MouseEvent) => any
) {
  let count = 0
  let lastTime = 0

  const handler = function (evt: MouseEvent) {
    const currentTime = new Date().getTime()
    count = currentTime - lastTime < 300 ? count + 1 : 0
    lastTime = new Date().getTime()
    if (count >= n - 1) {
      fn(evt)
      count = 0
    }
  }

  dom.addEventListener('click', handler)
}

export function isObject(type: unknown): type is Record<string, unknown> {
  return Object.prototype.toString.call(type) === '[object Object]'
}

export function isArray(type: unknown): type is Array<unknown> {
  return Array.isArray(type)
}

export function mergeObject<T>(source: T, target: T): T {
  if (isObject(source) && isObject(target)) {
    const objectTarget = <Record<string, unknown>>target
    for (const [key, val] of Object.entries(source)) {
      if (!objectTarget[key]) {
        objectTarget[key] = val
      } else {
        objectTarget[key] = mergeObject(val, objectTarget[key])
      }
    }
  } else if (isArray(source) && isArray(target)) {
    target.push(...source)
  }
  return target
}

export function nextTick(fn: Function) {
  setTimeout(() => {
    fn()
  }, 0)
}

export function convertNumberToChinese(num: number) {
  const chineseNum = [
    '零',
    '一',
    '二',
    '三',
    '四',
    '五',
    '六',
    '七',
    '八',
    '九'
  ]
  const chineseUnit = [
    '',
    '十',
    '百',
    '千',
    '万',
    '十',
    '百',
    '千',
    '亿',
    '十',
    '百',
    '千',
    '万',
    '十',
    '百',
    '千',
    '亿'
  ]
  if (!num || isNaN(num)) return '零'
  const numStr = num.toString().split('')
  let result = ''
  for (let i = 0; i < numStr.length; i++) {
    const desIndex = numStr.length - 1 - i
    result = `${chineseUnit[i]}${result}`
    result = `${chineseNum[Number(numStr[desIndex])]}${result}`
  }
  result = result.replace(/零(千|百|十)/g, '零').replace(/十零/g, '十')
  result = result.replace(/零+/g, '零')
  result = result.replace(/零亿/g, '亿').replace(/零万/g, '万')
  result = result.replace(/亿万/g, '亿')
  result = result.replace(/零+$/, '')
  result = result.replace(/^一十/g, '十')
  return result
}

export function cloneProperty<T>(
  properties: (keyof T)[],
  sourceElement: T,
  targetElement: T
) {
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i]
    const value = sourceElement[property]
    if (value !== undefined) {
      targetElement[property] = value
    } else {
      delete targetElement[property]
    }
  }
}

export function pickObject<T>(object: T, pickKeys: (keyof T)[]): T {
  const newObject: T = <T>{}
  for (const key in object) {
    if (pickKeys.includes(key)) {
      newObject[key] = object[key]
    }
  }
  return newObject
}

export function omitObject<T>(object: T, omitKeys: (keyof T)[]): T {
  const newObject: T = <T>{}
  for (const key in object) {
    if (!omitKeys.includes(key)) {
      newObject[key] = object[key]
    }
  }
  return newObject
}

export function convertStringToBase64(input: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const charArray = Array.from(data, byte => String.fromCharCode(byte))
  const base64 = window.btoa(charArray.join(''))
  return base64
}

export function findScrollContainer(element: HTMLElement) {
  let parent = element.parentElement
  while (parent) {
    const style = window.getComputedStyle(parent)
    const overflowY = style.getPropertyValue('overflow-y')
    if (
      parent.scrollHeight > parent.clientHeight &&
      (overflowY === 'auto' || overflowY === 'scroll')
    ) {
      return parent
    }
    parent = parent.parentElement
  }
  return document.documentElement
}

export function isArrayEqual(arr1: unknown[], arr2: unknown[]): boolean {
  if (arr1.length !== arr2.length) {
    return false
  }
  return !arr1.some(item => !arr2.includes(item))
}

export function isObjectEqual(obj1: unknown, obj2: unknown): boolean {
  if (!isObject(obj1) || !isObject(obj2)) return false
  const obj1Keys = Object.keys(obj1)
  const obj2Keys = Object.keys(obj2)
  if (obj1Keys.length !== obj2Keys.length) {
    return false
  }
  return !obj1Keys.some(key => obj2[key] !== obj1[key])
}
