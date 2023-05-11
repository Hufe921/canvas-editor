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