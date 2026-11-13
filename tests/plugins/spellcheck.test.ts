import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type Editor from '../../src/editor'
import {
  checkWordList,
  getSuggestionList,
  spellcheckPlugin
} from '../../src/plugins/spellcheck'

vi.mock('@cspell-en-us-dictionary', () => ({
  default: '/assets/en_US.trie-production-hash.gz'
}))

describe('spellcheck plugin', () => {
  beforeAll(async () => {
    const dictionary = await readFile(
      resolve(process.cwd(), 'node_modules/@cspell/dict-en_us/en_US.trie.gz')
    )
    vi.stubGlobal(
      'fetch',
      async () => new Response(dictionary, { status: 200 })
    )
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('使用 CSpell 检查英文错词并返回建议', async () => {
    const issueSet = await checkWordList([
      'Helo',
      'Hello',
      'NASA',
      'USA',
      'iPhone',
      "don't",
      'don’t',
      '主诉'
    ])

    expect([...issueSet]).toEqual(['Helo'])
    expect(await getSuggestionList('Helo')).toContain('Hello')
  })

  it('检查新单词时只提交一次错词区间', async () => {
    await checkWordList(['Helo'])
    const executeSetSpellcheckRangeList = vi.fn()
    const requestAnimationFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(callback => {
        callback(0)
        return 1
      })
    const editor = {
      command: {
        getOptions: () => ({ spellcheck: { disabled: false } }),
        getSpellcheckWordList: () => [
          { word: 'Helo', startIndex: 1, endIndex: 4 }
        ],
        executeSetSpellcheckRangeList
      },
      eventBus: {
        on: vi.fn()
      }
    } as unknown as Editor

    spellcheckPlugin(editor)
    await new Promise(resolve => window.setTimeout(resolve))

    expect(executeSetSpellcheckRangeList).toHaveBeenCalledTimes(1)
    expect(executeSetSpellcheckRangeList).toHaveBeenCalledWith([
      expect.objectContaining({
        startIndex: 1,
        endIndex: 4,
        data: { word: 'Helo' }
      })
    ])
    requestAnimationFrame.mockRestore()
  })
})
