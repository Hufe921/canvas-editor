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