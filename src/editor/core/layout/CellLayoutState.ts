import type { ITd } from '../../interface/table/Td'

export const CELL_LAYOUT_KEYS = [
  'x',
  'y',
  'width',
  'height',
  'rowIndex',
  'colIndex',
  'trIndex',
  'tdIndex',
  'rowList',
  'positionList',
  'mainHeight',
  'realHeight',
  'realMinHeight',
  'isLastRowTd',
  'isLastColTd',
  'isLastTd'
] as const

type CellState = Pick<ITd, (typeof CELL_LAYOUT_KEYS)[number]>
const states = new WeakMap<ITd, CellState>()

/** Runtime geometry lives outside document data. Accessors serve table tools. */
export function cellLayoutState(cell: ITd): CellState {
  const existing = states.get(cell)
  if (existing) return existing
  const state: CellState = {}
  for (const key of CELL_LAYOUT_KEYS) {
    if (cell[key] !== undefined) state[key] = cell[key] as never
    Object.defineProperty(cell, key, {
      configurable: true,
      enumerable: false,
      get: () => state[key],
      set: value => {
        state[key] = value as never
      }
    })
  }
  states.set(cell, state)
  return state
}
