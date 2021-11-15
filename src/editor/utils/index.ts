import { ZERO } from "../dataset/constant/Common"

export function debounce(func: Function, delay: number) {
  let timer: number
  return function (...args: any) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      // @ts-ignore
      func.apply(this, args)
    }, delay)
  }
}

export function writeText(text: string) {
  if (!text) return
  window.navigator.clipboard.writeText(text.replaceAll(ZERO, `\n`))
}

export function deepClone(obj: any) {
  if (!obj || typeof obj !== 'object') {
    return obj
  }
  let newObj: any = {}
  if (Array.isArray(obj)) {
    newObj = obj.map(item => deepClone(item))
  } else {
    Object.keys(obj).forEach((key) => {
      return newObj[key] = deepClone(obj[key])
    })
  }
  return newObj
}

export function isBody(node: Element): boolean {
  return node && node.nodeType === 1 && node.tagName.toLowerCase() === 'body'
}

export function findParent(node: Element, filterFn: Function, includeSelf: boolean) {
  if (node && !isBody(node)) {
    node = includeSelf ? node : node.parentNode as Element
    while (node) {
      if (!filterFn || filterFn(node) || isBody(node)) {
        return filterFn && !filterFn(node) && isBody(node)
          ? null
          : node
      }
      node = node.parentNode as Element
    }
  }
  return null
}