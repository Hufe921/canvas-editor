import { getBidiApi } from './bidiApi'
import { BidiRun, ResolvedDirection } from '../types'

export class BidiResolver {
  getLevelRuns(text: string, direction: ResolvedDirection): BidiRun[] {
    if (!text.length) {
      const level = direction === 'rtl' ? 1 : 0
      return [
        {
          start: 0,
          end: 0,
          level,
          direction: level % 2 === 1 ? 'rtl' : 'ltr'
        }
      ]
    }
    const { getEmbeddingLevels } = getBidiApi()
    const { levels } = getEmbeddingLevels(text, direction)
    const runs: BidiRun[] = []
    let start = 0
    for (let i = 1; i <= levels.length; i++) {
      if (i === levels.length || levels[i] !== levels[start]) {
        const level = levels[start]
        runs.push({
          start,
          end: i,
          level,
          direction: level % 2 === 1 ? 'rtl' : 'ltr'
        })
        start = i
      }
    }
    return runs
  }

  getVisualIndices(text: string, direction: ResolvedDirection): number[] {
    if (!text.length) return []
    const { getEmbeddingLevels, getReorderedIndices } = getBidiApi()
    const embedding = getEmbeddingLevels(text, direction)
    return getReorderedIndices(text, embedding) as number[]
  }

  getVisualRuns(text: string, direction: ResolvedDirection): BidiRun[] {
    const levelRuns = this.getLevelRuns(text, direction)
    if (levelRuns.length <= 1) return levelRuns
    const visualIndices = this.getVisualIndices(text, direction)
    const firstVisual = new Map<number, number>()
    for (let v = 0; v < visualIndices.length; v++) {
      const logical = visualIndices[v]
      if (!firstVisual.has(logical)) {
        firstVisual.set(logical, v)
      }
    }
    return [...levelRuns].sort((a, b) => {
      const va = firstVisual.get(a.start) ?? a.start
      const vb = firstVisual.get(b.start) ?? b.start
      return va - vb
    })
  }
}
