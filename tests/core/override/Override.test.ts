import { describe, it, expect } from 'vitest'
import { Override } from '../../../src/editor/core/override/Override'

describe('Override', () => {
  it('初始属性均为 undefined', () => {
    const override = new Override()
    expect(override.paste).toBeUndefined()
    expect(override.pasteImage).toBeUndefined()
    expect(override.copy).toBeUndefined()
    expect(override.drop).toBeUndefined()
  })
})
