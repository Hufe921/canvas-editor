export function queryParams(key: string): string | null {
  const query = window.location.search.substring(1)
  const vars = query.split('&')
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=')
    if (pair[0] == key) {
      return pair[1]
    }
  }
  return null
}

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

export function scrollIntoView(container: HTMLElement, selected: HTMLElement) {
  if (!selected) {
    container.scrollTop = 0
    return
  }
  const offsetParents: HTMLElement[] = []
  let pointer = <HTMLElement>selected.offsetParent
  while (pointer && container !== pointer && container.contains(pointer)) {
    offsetParents.push(pointer)
    pointer = <HTMLElement>pointer.offsetParent
  }
  const top =
    selected.offsetTop +
    offsetParents.reduce((prev, curr) => prev + curr.offsetTop, 0)
  const bottom = top + selected.offsetHeight
  const viewRectTop = container.scrollTop
  const viewRectBottom = viewRectTop + container.clientHeight
  if (top < viewRectTop) {
    container.scrollTop = top
  } else if (bottom > viewRectBottom) {
    container.scrollTop = bottom - container.clientHeight
  }
}

export function nextTick(fn: Function) {
  const callback = window.requestIdleCallback || window.setTimeout
  callback(() => {
    fn()
  })
}
