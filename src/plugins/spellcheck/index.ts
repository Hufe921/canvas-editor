import dictionaryConfig from '@cspell/dict-en_us'
import dictionaryUrl from '@cspell-en-us-dictionary'
import {
  decodeFile,
  mapDictionaryInformationToWeightMap,
  normalizeWordForCaseInsensitive,
  type ITrie
} from 'cspell-trie-lib'
import type Editor from '../../editor'
import { EDITOR_COMPONENT } from '../../editor/dataset/constant/Editor'
import { EditorComponent } from '../../editor/dataset/enum/Editor'
import type { ISpellcheckWord } from '../../editor/interface/Spellcheck'

interface ISpellcheckPluginData {
  word: string
}

const ENGLISH_WORD_REGEXP = /^[A-Za-z]+(?:['’][A-Za-z]+)*$/
const dictionaryDefinition = dictionaryConfig.dictionaryDefinitions[0]
const weightMap = mapDictionaryInformationToWeightMap(
  dictionaryDefinition.dictionaryInformation
)
let dictionaryPromise: Promise<ITrie> | null = null

async function loadDictionary() {
  const response = await fetch(dictionaryUrl)
  if (!response.ok) {
    throw new Error(`Failed to load dictionary: ${response.status}`)
  }
  const content = new Uint8Array(await response.arrayBuffer())
  const url = new URL(dictionaryDefinition.path, window.location.href)
  if (content[0] !== 0x1f || content[1] !== 0x8b) {
    url.pathname = url.pathname.slice(0, -3)
  }
  return decodeFile({
    url,
    content
  })
}

function getDictionary() {
  if (!dictionaryPromise) {
    dictionaryPromise = loadDictionary().catch(error => {
      dictionaryPromise = null
      throw error
    })
  }
  return dictionaryPromise
}

function matchWordCase(word: string, suggestion: string) {
  if (word === word.toUpperCase()) return suggestion.toUpperCase()
  if (word[0] === word[0].toUpperCase()) {
    return suggestion[0].toUpperCase() + suggestion.slice(1)
  }
  return suggestion
}

function getEnglishWordList(wordList: string[]) {
  const uniqueWordList: string[] = []
  const wordSet = new Set<string>()
  for (const word of wordList) {
    if (!ENGLISH_WORD_REGEXP.test(word) || wordSet.has(word)) continue
    wordSet.add(word)
    uniqueWordList.push(word)
  }
  return uniqueWordList
}

function normalizeWord(word: string) {
  return normalizeWordForCaseInsensitive(word.replaceAll('’', "'"))[0]
}

function getIssueSet(wordList: string[], dictionary: ITrie) {
  const issueSet = new Set<string>()
  for (const word of wordList) {
    if (!dictionary.hasWord(normalizeWord(word), false)) issueSet.add(word)
  }
  return issueSet
}

export async function checkWordList(wordList: string[]) {
  const englishWordList = getEnglishWordList(wordList)
  if (!englishWordList.length) return new Set<string>()
  return getIssueSet(englishWordList, await getDictionary())
}

export async function getSuggestionList(word: string) {
  if (!ENGLISH_WORD_REGEXP.test(word)) return []
  const dictionary = await getDictionary()
  const suggestions = dictionary.suggest(normalizeWord(word), {
    numSuggestions: 2,
    includeTies: false,
    ignoreCase: true,
    timeout: 100,
    weightMap
  })
  const suggestionList: string[] = []
  for (const suggestion of suggestions) {
    suggestionList.push(matchWordCase(word, suggestion))
  }
  return suggestionList
}

export function spellcheckPlugin(editor: Editor) {
  const checkCache = new Map<string, boolean>()
  const suggestionCache = new Map<string, string[]>()
  let popup: HTMLDivElement | null = null
  const removePopup = () => {
    document.removeEventListener('mousedown', removePopup)
    popup?.remove()
    popup = null
  }
  let updateVersion = 0
  const setRangeList = (wordList: ISpellcheckWord[]) => {
    const rangeList = []
    for (const word of wordList) {
      if (checkCache.get(word.word) !== false) continue
      rangeList.push({
        ...word,
        data: {
          word: word.word
        }
      })
    }
    editor.command.executeSetSpellcheckRangeList(rangeList)
  }
  const update = async (version: number) => {
    const wordList = editor.command.getSpellcheckWordList()
    const pendingWordList: string[] = []
    const pendingWordSet = new Set<string>()
    for (const word of wordList) {
      if (checkCache.has(word.word) || pendingWordSet.has(word.word)) continue
      pendingWordSet.add(word.word)
      pendingWordList.push(word.word)
    }
    if (!pendingWordList.length) {
      setRangeList(wordList)
      return
    }

    const englishWordList = getEnglishWordList(pendingWordList)
    for (const word of pendingWordList) {
      if (!ENGLISH_WORD_REGEXP.test(word)) checkCache.set(word, true)
    }
    if (!englishWordList.length) {
      setRangeList(wordList)
      return
    }

    let dictionary: ITrie
    try {
      dictionary = await getDictionary()
    } catch {
      setRangeList(wordList)
      return
    }
    if (version !== updateVersion) return
    const issueSet = getIssueSet(englishWordList, dictionary)
    for (const word of englishWordList) {
      checkCache.set(word, !issueSet.has(word))
    }
    if (version !== updateVersion) return
    setRangeList(wordList)
  }
  let updateFrame = 0

  editor.eventBus.on('spellcheckClick', async ({ evt, range }) => {
    removePopup()
    const data = range.data as ISpellcheckPluginData | undefined
    if (!data?.word) return
    const { word } = data
    popup = document.createElement('div')
    const activePopup = popup
    popup.className = 'spellcheck-popup'
    popup.setAttribute(EDITOR_COMPONENT, EditorComponent.POPUP)

    const title = document.createElement('div')
    title.className = 'spellcheck-popup__title'
    title.textContent = word
    popup.append(title)

    popup.style.left = `${evt.clientX + 4}px`
    popup.style.top = `${evt.clientY + 4}px`
    document.body.append(popup)
    window.setTimeout(() => {
      document.addEventListener('mousedown', removePopup, { once: true })
    })

    let suggestionList = suggestionCache.get(word)
    if (!suggestionList) {
      try {
        suggestionList = await getSuggestionList(word)
      } catch {
        return
      }
      suggestionCache.set(word, suggestionList)
    }
    if (popup !== activePopup) return
    for (const suggestion of suggestionList) {
      const item = document.createElement('button')
      item.type = 'button'
      item.className = 'spellcheck-popup__item'
      item.textContent = suggestion
      item.onmousedown = event => {
        event.preventDefault()
        event.stopPropagation()
        const { tableId, trIndex, tdIndex } = range
        editor.command.executeSetRange(
          range.startIndex - 1,
          range.endIndex,
          tableId,
          tdIndex,
          tdIndex,
          trIndex,
          trIndex
        )
        editor.command.executeInsertElementList([{ value: suggestion }])
        removePopup()
      }
      popup.append(item)
    }
  })
  const scheduleUpdate = () => {
    removePopup()
    window.cancelAnimationFrame(updateFrame)
    updateVersion++
    if (editor.command.getOptions().spellcheck.disabled) return
    const version = updateVersion
    updateFrame = window.requestAnimationFrame(() => {
      void update(version)
    })
  }
  editor.eventBus.on('renderChange', scheduleUpdate)
  scheduleUpdate()
}
