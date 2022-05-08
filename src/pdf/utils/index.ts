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
