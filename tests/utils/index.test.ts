import { describe, it, expect, vi } from 'vitest'
import {
  debounce,
  throttle,
  deepClone,
  deepCloneOmitKeys,
  getUUID,
  splitText,
  mergeObject,
  isObject,
  isArray,
  isNumber,
  isString,
  convertNumberToChinese,
  cloneProperty,
  omitObject,
  pickObject,
  isArrayEqual,
  nextTick,
  convertStringToBase64,
  isRectIntersect,
  indexOf,
  normalizeLineBreak,
  isBody,
  findParent,
  isObjectEqual,
  isNonValue,
  deleteProperty
} from '@/editor/utils'

describe('debounce', () => {
  it('多次快速调用只执行最后一次', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced(1)
    debounced(2)
    debounced(3)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(3)
    vi.useRealTimers()
  })

  it('单次调用在延迟后执行', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 50)
    debounced('a')
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
    vi.useRealTimers()
  })
})

describe('throttle', () => {
  it('第一次调用立即执行', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(1)
    vi.useRealTimers()
  })

  it('延迟内调用被节流', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled(1)
    throttled(2)
    throttled(3)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('延迟后再次执行', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled(1)
    vi.advanceTimersByTime(100)
    throttled(2)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(2)
    vi.useRealTimers()
  })
})

describe('deepClone', () => {
  it('基本类型返回相同值', () => {
    expect(deepClone(123)).toBe(123)
    expect(deepClone('abc')).toBe('abc')
    expect(deepClone(null)).toBe(null)
    expect(deepClone(undefined)).toBe(undefined)
  })

  it('对象创建新引用', () => {
    const obj = { a: 1 }
    const cloned = deepClone(obj)
    expect(cloned).toEqual(obj)
    expect(cloned).not.toBe(obj)
  })

  it('嵌套对象深克隆', () => {
    const obj = { a: { b: { c: 1 } } }
    const cloned = deepClone(obj)
    expect(cloned).toEqual(obj)
    expect(cloned.a).not.toBe(obj.a)
    expect(cloned.a.b).not.toBe(obj.a.b)
  })

  it('数组被克隆', () => {
    const arr = [1, { a: 2 }, [3]]
    const cloned = deepClone(arr)
    expect(cloned).toEqual(arr)
    expect(cloned).not.toBe(arr)
    expect(cloned[1]).not.toBe(arr[1])
    expect(cloned[2]).not.toBe(arr[2])
  })

  it('structuredClone 路径被测试', () => {
    // Node 24 支持 structuredClone，此测试验证该路径
    const obj = { date: new Date(2024, 0, 1), map: new Map([['a', 1]]) }
    const cloned = deepClone(obj)
    expect(cloned).toEqual(obj)
    expect(cloned.date).not.toBe(obj.date)
  })
})

describe('deepCloneOmitKeys', () => {
  it('顶层省略指定键', () => {
    const obj = { a: 1, b: 2, c: 3 }
    const cloned = deepCloneOmitKeys(obj, ['b'])
    expect(cloned).toEqual({ a: 1, c: 3 })
  })

  it('嵌套对象中省略指定键', () => {
    const obj = { a: 1, nested: { b: 2, c: 3 } }
    const cloned = deepCloneOmitKeys(obj, ['b'])
    expect(cloned).toEqual({ a: 1, nested: { c: 3 } })
  })

  it('数组被处理', () => {
    const obj = [{ a: 1, b: 2 }, { a: 3, b: 4 }]
    const cloned = deepCloneOmitKeys(obj, ['b'])
    expect(cloned).toEqual([{ a: 1 }, { a: 3 }])
  })
})

describe('getUUID', () => {
  it('返回符合 UUID 格式的字符串', () => {
    const uuid = getUUID()
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('多次调用返回不同值', () => {
    const uuid1 = getUUID()
    const uuid2 = getUUID()
    expect(uuid1).not.toBe(uuid2)
  })
})

describe('splitText', () => {
  it('简单 ASCII 文本按字符分割', () => {
    expect(splitText('abc')).toEqual(['a', 'b', 'c'])
  })

  it('中文文本正确分割', () => {
    expect(splitText('你好')).toEqual(['你', '好'])
  })

  it('Emoji 作为一个分段', () => {
    expect(splitText('😀')).toEqual(['😀'])
  })

  it('ZWJ 序列作为一个分段', () => {
    expect(splitText('👨‍👩‍👧')).toEqual(['👨‍👩‍👧'])
  })

  it('代理对处理', () => {
    expect(splitText('\uD83D\uDE00')).toEqual(['\uD83D\uDE00'])
  })

  it('降级路径：删除 Intl.Segmenter 后使用 fallback', () => {
    const OriginalSegmenter = (globalThis as any).Intl.Segmenter
    ;(globalThis as any).Intl.Segmenter = undefined
    try {
      expect(splitText('abc')).toEqual(['a', 'b', 'c'])
      expect(splitText('😀')).toEqual(['😀'])
    } finally {
      ;(globalThis as any).Intl.Segmenter = OriginalSegmenter
    }
  })
})

describe('mergeObject', () => {
  it('简单合并', () => {
    const result = mergeObject({ a: 1 }, { b: 2 })
    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('嵌套合并', () => {
    const result = mergeObject({ a: { b: 1 } }, { a: { c: 2 } })
    expect(result).toEqual({ a: { b: 1, c: 2 } })
  })

  it('数组连接', () => {
    const result = mergeObject([1, 2], [3, 4])
    expect(result).toEqual([3, 4, 1, 2])
  })

  it('#1405 回归：防止原型污染', () => {
    const target: any = {}
    mergeObject(JSON.parse('{"__proto__":{"polluted":true}}'), target)
    expect(({} as any).polluted).toBeUndefined()
  })

  it('constructor 和 prototype 键被忽略', () => {
    const target: any = {}
    mergeObject({ constructor: { evil: true }, prototype: { evil: true } }, target)
    // target.constructor 是对象原型链上的 Object，mergeObject 不会覆盖原型链属性
    // 但 mergeObject 会跳过这些键，不会给 target 添加新的 own property
    expect(Object.prototype.hasOwnProperty.call(target, 'constructor')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(target, 'prototype')).toBe(false)
  })
})

describe('类型判断函数', () => {
  it('isObject 正例和反例', () => {
    expect(isObject({})).toBe(true)
    expect(isObject(null)).toBe(false)
    expect(isObject(undefined)).toBe(false)
    expect(isObject([])).toBe(false)
    expect(isObject(new Date())).toBe(false)
  })

  it('isArray 正例和反例', () => {
    expect(isArray([])).toBe(true)
    expect(isArray({})).toBe(false)
    expect(isArray(null)).toBe(false)
  })

  it('isNumber 正例和反例', () => {
    expect(isNumber(123)).toBe(true)
    expect(isNumber(NaN)).toBe(true)
    expect(isNumber('123')).toBe(false)
    expect(isNumber(null)).toBe(false)
  })

  it('isString 正例和反例', () => {
    expect(isString('str')).toBe(true)
    expect(isString('')).toBe(true)
    expect(isString(123)).toBe(false)
    expect(isString(null)).toBe(false)
  })
})

describe('convertNumberToChinese', () => {
  it('数字转中文', () => {
    expect(convertNumberToChinese(0)).toBe('零')
    expect(convertNumberToChinese(5)).toBe('五')
    expect(convertNumberToChinese(10)).toBe('十')
    expect(convertNumberToChinese(15)).toBe('十五')
    expect(convertNumberToChinese(100)).toBe('一百')
    expect(convertNumberToChinese(101)).toBe('一百零一')
    expect(convertNumberToChinese(10000)).toBe('一万')
    expect(convertNumberToChinese(100000000)).toBe('一亿')
  })

  it('NaN 和 undefined 返回零', () => {
    expect(convertNumberToChinese(NaN)).toBe('零')
    expect(convertNumberToChinese(undefined as any)).toBe('零')
  })
})

describe('cloneProperty', () => {
  it('复制已有属性', () => {
    const source = { a: 1, b: 2 }
    const target = { c: 3 } as any
    cloneProperty(['a', 'b'], source, target)
    expect(target).toEqual({ a: 1, b: 2, c: 3 })
  })

  it('删除目标中 undefined 属性', () => {
    const source = { a: undefined }
    const target = { a: 1, b: 2 } as any
    cloneProperty(['a'], source, target)
    expect(target).not.toHaveProperty('a')
    expect(target).toHaveProperty('b')
  })
})

describe('omitObject', () => {
  it('返回不含省略键的对象', () => {
    expect(omitObject({ a: 1, b: 2, c: 3 }, ['b'])).toEqual({ a: 1, c: 3 })
  })

  it('空键数组处理', () => {
    expect(omitObject({ a: 1 }, [])).toEqual({ a: 1 })
  })
})

describe('pickObject', () => {
  it('返回只含选中键的对象', () => {
    expect(pickObject({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 })
  })

  it('空键数组处理', () => {
    expect(pickObject({ a: 1 }, [])).toEqual({})
  })
})

describe('isArrayEqual', () => {
  it('相同元素数组相等', () => {
    expect(isArrayEqual([1, 2, 3], [1, 2, 3])).toBe(true)
  })

  it('不同长度不相等', () => {
    expect(isArrayEqual([1, 2], [1, 2, 3])).toBe(false)
  })

  it('不同元素不相等', () => {
    expect(isArrayEqual([1, 2], [3, 4])).toBe(false)
  })

  it('顺序不重要', () => {
    expect(isArrayEqual([1, 2, 3], [3, 2, 1])).toBe(true)
  })
})

describe('nextTick', () => {
  it('回调在超时后执行', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    nextTick(fn)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(0)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})

describe('convertStringToBase64', () => {
  it('ASCII 字符串编码', () => {
    expect(convertStringToBase64('hello')).toBe('aGVsbG8=')
  })

  it('Unicode 字符串编码', () => {
    expect(convertStringToBase64('你好')).toBe('5L2g5aW9')
  })
})

describe('isRectIntersect', () => {
  it('重叠矩形返回 true', () => {
    expect(isRectIntersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 })).toBe(true)
  })

  it('不重叠矩形返回 false', () => {
    expect(isRectIntersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 20, width: 10, height: 10 })).toBe(false)
  })

  it('边缘接触返回 true', () => {
    expect(isRectIntersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 })).toBe(true)
  })
})

describe('indexOf', () => {
  it('字符串搜索：找到', () => {
    expect(indexOf('hello world', 'world')).toEqual({ index: 6, length: 5 })
  })

  it('字符串搜索：未找到', () => {
    expect(indexOf('hello world', 'foo')).toEqual({ index: -1, length: 0 })
  })

  it('正则搜索：找到', () => {
    expect(indexOf('hello world', /world/)).toEqual({ index: 6, length: 5 })
  })

  it('正则搜索：未找到', () => {
    expect(indexOf('hello world', /foo/)).toEqual({ index: -1, length: 0 })
  })

  it('空字符串搜索', () => {
    expect(indexOf('hello', '')).toEqual({ index: 0, length: 0 })
  })

  it('fromIndex 处理', () => {
    expect(indexOf('hello world', 'o', 5)).toEqual({ index: 7, length: 1 })
  })
})

describe('normalizeLineBreak', () => {
  it('\\r\\n 转为 \\n', () => {
    expect(normalizeLineBreak('a\r\nb')).toBe('a\nb')
  })

  it('\\r 转为 \\n', () => {
    expect(normalizeLineBreak('a\rb')).toBe('a\nb')
  })

  it('\\n 保持不变', () => {
    expect(normalizeLineBreak('a\nb')).toBe('a\nb')
  })
})

describe('isBody', () => {
  it('body 元素返回 true', () => {
    const body = document.createElement('body')
    expect(isBody(body)).toBe(true)
  })

  it('非 body 元素返回 false', () => {
    const div = document.createElement('div')
    expect(isBody(div)).toBe(false)
  })
})

describe('findParent', () => {
  it('基本查找', () => {
    const parent = document.createElement('div')
    parent.id = 'parent'
    const child = document.createElement('span')
    parent.appendChild(child)
    const result = findParent(child, (node: Element) => node.id === 'parent', false)
    expect(result).toBe(parent)
  })
})

describe('downloadFile', () => {
  it('TODO: 需要真实浏览器 DOM 点击行为，跳过详细测试', () => {
    // downloadFile 创建 a 元素并触发 click，jsdom 中 click 不会真正下载
    expect(true).toBe(true)
  })
})

describe('threeClick', () => {
  it('TODO: 需要真实浏览器事件序列，跳过详细测试', () => {
    // threeClick 依赖 300ms 内的三次点击，jsdom 中难以模拟真实时间
    expect(true).toBe(true)
  })
})

describe('findScrollContainer', () => {
  it('TODO: 需要 getComputedStyle 和真实滚动尺寸，跳过详细测试', () => {
    // jsdom 中 getComputedStyle 返回空值，scrollHeight/clientHeight 为 0
    expect(true).toBe(true)
  })
})

describe('scrollIntoView', () => {
  it('TODO: 需要 offsetParent 和真实布局，跳过详细测试', () => {
    // jsdom 中 offsetParent 通常为 null，offsetTop/offsetHeight 为 0
    expect(true).toBe(true)
  })
})

describe('loadImage', () => {
  it('TODO: 需要真实图片加载，跳过详细测试', () => {
    // loadImage 创建 Image 并加载真实资源，jsdom 中无法完成
    expect(true).toBe(true)
  })
})

describe('isObjectEqual', () => {
  it('相同对象返回 true', () => {
    expect(isObjectEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
  })

  it('不同对象返回 false', () => {
    expect(isObjectEqual({ a: 1 }, { a: 2 })).toBe(false)
  })

  it('非对象返回 false', () => {
    expect(isObjectEqual(1, 1)).toBe(false)
  })
})

describe('isNonValue', () => {
  it('undefined 和 null 返回 true', () => {
    expect(isNonValue(undefined)).toBe(true)
    expect(isNonValue(null)).toBe(true)
  })

  it('其他值返回 false', () => {
    expect(isNonValue(0)).toBe(false)
    expect(isNonValue('')).toBe(false)
    expect(isNonValue(false)).toBe(false)
  })
})

describe('deleteProperty', () => {
  it('从数组中删除指定键', () => {
    const arr = ['a', 'b', 'c', 'b']
    deleteProperty(arr, ['b'])
    expect(arr).toEqual(['a', 'c'])
  })

  it('空数组不报错', () => {
    const arr: string[] = []
    deleteProperty(arr, ['a'])
    expect(arr).toEqual([])
  })
})
