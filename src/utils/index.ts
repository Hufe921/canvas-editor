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