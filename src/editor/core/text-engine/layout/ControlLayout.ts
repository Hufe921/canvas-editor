import type { TextSpan } from '../types'
import type { NativeParagraphInput } from './TextLayoutService'

/** Reserve control chrome in ephemeral layout spans, never document elements. */
export function prepareControlLayout(
  input: NativeParagraphInput,
  measure: (spans: TextSpan[]) => number,
  valueOrigin: (spans: TextSpan[], id: string) => number = () => 0
): NativeParagraphInput {
  const spans: TextSpan[] = []
  const positions: NativeParagraphInput['positions'] = []
  let offset = 0
  for (let i = 0; i < input.spans.length; ) {
    const first = input.spans[i]
    const id = first.style.control?.id
    let end = i + 1
    if (id) while (input.spans[end]?.style.control?.id === id) end++
    const group = input.spans.slice(i, end)
    const control = first.style.control
    const extra = control?.minWidth
      ? Math.max(0, control.minWidth - measure(group))
      : 0
    const value = group.findIndex(s =>
      ['value', 'placeholder', 'preText'].includes(
        s.style.control?.component || ''
      )
    )
    const postfix = group.findIndex(
      s => s.style.control?.component === 'postfix'
    )
    const before =
      value < 0
        ? 0
        : control?.flex === 'center'
          ? extra / 2
          : control?.flex === 'right'
            ? extra
            : 0
    const inset =
      control?.valueStart && id && value >= 0 && extra
        ? valueOrigin([...spans, ...group], id) +
          (before % input.availableWidth)
        : 0
    const capacity = Math.max(1, input.availableWidth - inset)
    const addSpace = (width: number, anchor: TextSpan, at: number) => {
      // Long minimum widths may span lines. Every box has a real source anchor.
      while (width > 0) {
        const advance = Math.min(width, capacity)
        const source = input.positions[at] || input.positions[offset]
        spans.push({
          text: '\uFFFC',
          logicalIndex: anchor.logicalIndex,
          logicalIndices: [anchor.logicalIndex],
          style: {
            ...anchor.style,
            padding: undefined,
            explicitWidth: undefined,
            objectType: 'controlSpace',
            objectWidth: advance,
            control: anchor.style.control
              ? { ...anchor.style.control, component: 'layoutSpace' }
              : undefined
          }
        })
        positions.push({ ...source, textEnd: source?.textStart || 0 })
        width -= advance
      }
    }
    for (let j = 0; j < group.length; j++) {
      const span = group[j]
      if (j === value) addSpace(before, span, offset)
      if (j === postfix) addSpace(extra - before, span, offset)
      spans.push(span)
      positions.push(
        ...input.positions.slice(offset, offset + span.text.length)
      )
      offset += span.text.length
    }
    // A partial control may omit its postfix; reserve at the final value.
    if (postfix < 0 && extra > before) {
      addSpace(extra - before, group[group.length - 1], Math.max(0, offset - 1))
    }
    i = end
  }
  return { ...input, spans, positions }
}
