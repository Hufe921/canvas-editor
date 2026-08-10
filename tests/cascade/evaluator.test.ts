import { describe, it, expect } from 'vitest'
import { tokenize } from '@/editor/core/cascade/expression/tokenizer'
import { parse } from '@/editor/core/cascade/expression/parser'
import {
  evaluate,
  evaluateValue,
  IResolvedValue
} from '@/editor/core/cascade/expression/evaluator'

const run = (src: string, values: Record<string, IResolvedValue>) =>
  evaluate(parse(tokenize(src)), { resolve: name => values[name] })

const runValue = (src: string, values: Record<string, IResolvedValue>) =>
  evaluateValue(parse(tokenize(src)), { resolve: name => values[name] })

describe('表达式 evaluator', () => {
  it('code 比较', () => {
    expect(run("getValue('sex') == '1'", { sex: { code: '1' } })).toBe(true)
    expect(run("getValue('sex') == '1'", { sex: { code: '0' } })).toBe(false)
    expect(run("getValue('sex') != '1'", { sex: { code: null } })).toBe(true)
  })

  it('数值比较（text 自动转数值）', () => {
    expect(run("getValue('age') > 60", { age: { text: '61' } })).toBe(true)
    expect(run("getValue('age') >= 60", { age: { text: '60' } })).toBe(true)
    expect(run("getValue('age') > 60", { age: { text: 'abc' } })).toBe(false)
    expect(run("getValue('age') > 60", { age: { text: null } })).toBe(false)
  })

  it('逻辑运算与 not', () => {
    const values = {
      gender: { code: '2' },
      age: { text: '30' }
    }
    expect(
      run(
        "getValue('gender') == '2' && getValue('age') >= 15 && getValue('age') <= 49",
        values
      )
    ).toBe(true)
    expect(
      run("getValue('gender') == '1' || getValue('age') < 18", values)
    ).toBe(false)
    expect(run("!(getValue('age') > 60)", values)).toBe(true)
  })

  it('in 运算', () => {
    expect(
      run("getValue('dept') in ['icu','ccu']", { dept: { code: 'icu' } })
    ).toBe(true)
    expect(
      run("getValue('dept') in ['icu','ccu']", { dept: { code: 'er' } })
    ).toBe(false)
    // checkbox 数组左值：任一命中
    expect(
      run("getValue('tags') in ['1','2']", { tags: { codes: ['2', '5'] } })
    ).toBe(true)
  })

  it('empty / notEmpty', () => {
    expect(run("empty(getValue('a'))", { a: { text: '' } })).toBe(true)
    expect(run("empty(getValue('a'))", { a: { text: null } })).toBe(true)
    expect(run("empty(getValue('a'))", { a: { code: null } })).toBe(true)
    expect(run("empty(getValue('a'))", { a: { codes: [] } })).toBe(true)
    expect(run("notEmpty(getValue('a'))", { a: { text: ' x ' } })).toBe(true)
    // 未命中标识符按空处理
    expect(run("empty(getValue('a'))", {})).toBe(true)
  })

  it('len / count / contains', () => {
    expect(run("len(getValue('desc')) > 3", { desc: { text: 'abcde' } })).toBe(
      true
    )
    expect(
      run("count(getValue('tags')) >= 2", { tags: { codes: ['1', '2'] } })
    ).toBe(true)
    expect(
      run("contains(getValue('tags'), '1')", { tags: { codes: ['1', '2'] } })
    ).toBe(true)
    expect(
      run("contains(getValue('desc'), '高血压')", {
        desc: { text: '原发性高血压' }
      })
    ).toBe(true)
  })

  it('日期比较', () => {
    const values = { d: { text: '2024-06-01', isDate: true } }
    expect(run("getValue('d') > '2024-01-01'", values)).toBe(true)
    expect(run("getValue('d') < '2024-01-01'", values)).toBe(false)
    expect(
      run("getValue('d') > 'today'", {
        d: { text: '2999-01-01', isDate: true }
      })
    ).toBe(true)
  })

  it('getValue 之间比较', () => {
    const values = {
      discharge: { text: '2024-05-01', isDate: true },
      admission: { text: '2024-06-01', isDate: true }
    }
    expect(run("getValue('discharge') < getValue('admission')", values)).toBe(
      true
    )
  })

  it('布尔上下文：裸 getValue', () => {
    expect(run("getValue('checked')", { checked: { code: '1' } })).toBe(true)
    expect(run("getValue('checked')", { checked: { code: null } })).toBe(false)
  })

  it('未知函数抛错由调用方兜底（本层抛错）', () => {
    expect(() => run("foo(getValue('x'))", { x: { text: '1' } })).toThrow()
  })

  it('算术运算（evaluateValue）', () => {
    const values = {
      height: { text: '1.75' },
      weight: { text: '70' }
    }
    expect(
      runValue(
        "getValue('weight') / (getValue('height') * getValue('height'))",
        values
      )
    ).toBeCloseTo(22.857, 2)
    expect(
      runValue("getValue('a') + getValue('b')", {
        a: { text: '1' },
        b: { text: '2' }
      })
    ).toBe(3)
    expect(
      runValue("getValue('a') - getValue('b') - getValue('c')", {
        a: { text: '10' },
        b: { text: '3' },
        c: { text: '2' }
      })
    ).toBe(5)
    expect(
      runValue("getValue('a') % getValue('b')", {
        a: { text: '7' },
        b: { text: '3' }
      })
    ).toBe(1)
  })

  it('算术结果参与比较', () => {
    const values = { a: { text: '20' }, b: { text: '10' } }
    expect(run("getValue('a') + getValue('b') > 28", values)).toBe(true)
    expect(run("getValue('a') + getValue('b') > 30", values)).toBe(false)
  })

  it('字符串拼接（+ 任一侧非数值时）', () => {
    const values = {
      lastName: { text: '张' },
      firstName: { text: '三' }
    }
    expect(
      runValue("getValue('lastName') + getValue('firstName')", values)
    ).toBe('张三')
    expect(runValue("getValue('a') + 'cm'", { a: { text: '175' } })).toBe(
      '175cm'
    )
  })

  it('空操作数与除零得 null', () => {
    expect(
      runValue("getValue('a') + getValue('b')", {
        a: { text: null },
        b: { text: '1' }
      })
    ).toBeNull()
    expect(
      runValue("getValue('a') / getValue('b')", {
        a: { text: '1' },
        b: { text: '0' }
      })
    ).toBeNull()
    expect(runValue("getValue('a') / 'x'", { a: { text: '1' } })).toBeNull()
  })

  it('round 函数', () => {
    const values = {
      height: { text: '1.75' },
      weight: { text: '70' }
    }
    expect(
      runValue(
        "round(getValue('weight') / (getValue('height') * getValue('height')), 1)",
        values
      )
    ).toBe(22.9)
    expect(runValue('round(3.14159)', {})).toBe(3)
    expect(runValue('round(3.14159, 2)', {})).toBe(3.14)
    expect(runValue("round(getValue('x'))", { x: { text: null } })).toBeNull()
  })

  it('getValue(@self) 通过 resolveSelf 取值', () => {
    const node = parse(tokenize("getValue(@self) == '1'"))
    expect(
      evaluate(node, {
        resolve: () => undefined,
        resolveSelf: () => ({ code: '1' })
      })
    ).toBe(true)
    // 未提供 resolveSelf 时按空处理
    expect(
      evaluate(node, {
        resolve: () => undefined
      })
    ).toBe(false)
  })

  it('now() 与日期比较、参与算术', () => {
    expect(
      run("getValue('future') > now()", {
        future: { text: '2999-01-01', isDate: true }
      })
    ).toBe(true)
    expect(
      run("getValue('past') < now()", {
        past: { text: '2000-01-01', isDate: true }
      })
    ).toBe(true)
    expect(typeof runValue('round(now() / 1000)', {})).toBe('number')
  })

  it('datediff 日期差', () => {
    const v = {
      end: { text: '2024-06-10', isDate: true },
      start: { text: '2024-06-01', isDate: true }
    }
    expect(runValue("datediff(getValue('end'), getValue('start'))", v)).toBe(9)
    expect(run("datediff(getValue('end'), getValue('start')) > 7", v)).toBe(
      true
    )
    expect(runValue("datediff('2024-06-01', '2024-06-10')", {})).toBe(-9)
    expect(runValue("datediff('2024-06-02', '2024-06-01', 'h')", {})).toBe(24)
    expect(runValue("datediff('2999-01-01', 'today')", {})).toBeGreaterThan(0)
    expect(runValue("datediff('2024-01-01', '2000-01-01')", {})).toBeCloseTo(
      8766,
      -2
    )
  })

  it('datediff 空值或非法日期返回 null', () => {
    expect(
      runValue("datediff(getValue('a'), getValue('b'))", {
        a: { text: null },
        b: { text: '2024-06-01' }
      })
    ).toBeNull()
    expect(runValue("datediff(getValue('x'), '2024-06-01')", {})).toBeNull()
  })

  it('floor / ceil / abs', () => {
    expect(runValue('floor(3.7)', {})).toBe(3)
    expect(runValue('ceil(3.2)', {})).toBe(4)
    expect(runValue('abs(-5)', {})).toBe(5)
    expect(runValue('abs(5)', {})).toBe(5)
    expect(runValue("floor(getValue('x'))", { x: { text: 'abc' } })).toBeNull()
  })

  it('min / max', () => {
    expect(runValue('min(3, 7, 1)', {})).toBe(1)
    expect(runValue('max(3, 7, 1)', {})).toBe(7)
    expect(
      runValue("max(getValue('a'), getValue('b'))", {
        a: { text: '120' },
        b: { text: '80' }
      })
    ).toBe(120)
    expect(runValue('min()', {})).toBeNull()
  })

  it('power / sqrt', () => {
    expect(runValue('power(2, 10)', {})).toBe(1024)
    expect(runValue('sqrt(9)', {})).toBe(3)
    expect(runValue('sqrt(-1)', {})).toBeNull()
    expect(
      runValue("power(getValue('x'), 2)", { x: { text: null } })
    ).toBeNull()
  })

  it('if 条件表达式（短路求值）', () => {
    expect(runValue("if(1 > 2, 'a', 'b')", {})).toBe('b')
    expect(
      runValue("if(getValue('age') >= 18, '成年', '未成年')", {
        age: { text: '20' }
      })
    ).toBe('成年')
    expect(
      runValue(
        "if(getValue('bmi') < 18.5, '偏瘦', if(getValue('bmi') < 28, '正常', '肥胖'))",
        { bmi: { text: '30' } }
      )
    ).toBe('肥胖')
    // 短路：cond 为假时不求值 b 分支
    expect(runValue("if(empty(getValue('x')), '空', getValue('x'))", {})).toBe(
      '空'
    )
  })
})
