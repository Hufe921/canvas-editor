export function debounce(func: Function, delay: number) {
  let timer: number
  return function (...args: any) {
    if (timer) {
      window.clearTimeout(timer)
    }
    timer = window.setTimeout(() => {
      // @ts-ignore
      func.apply(this, args)
    }, delay)
  }
}

export function deepClone<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj
  }
  let newObj: any = {}
  if (Array.isArray(obj)) {
    newObj = obj.map(item => deepClone(item))
  } else {
    Object.keys(obj as any).forEach((key) => {
      // @ts-ignore
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

export function getUUID(): string {
  function S4(): string {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
  }
  return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4())
}

export function splitText(text: string): string[] {
  const data: string[] = []
  for (const t of text) {
    data.push(t)
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

function nClickEvent(n: number, dom: HTMLElement, fn: (evt: MouseEvent) => any) {
  let count = 0
  let lastTime = 0

  const handler = function (evt: MouseEvent) {
    const currentTime = new Date().getTime()
    count = (currentTime - lastTime < 300) ? count + 1 : 0
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