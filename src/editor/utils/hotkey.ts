import { isApple } from './ua'

export function isMod(evt: KeyboardEvent | MouseEvent) {
  return isApple ? evt.metaKey : evt.ctrlKey
}
