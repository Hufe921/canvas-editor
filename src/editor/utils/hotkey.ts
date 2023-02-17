import { isApple } from './ua'

export function isMod(evt: KeyboardEvent) {
  return isApple ? evt.metaKey : evt.ctrlKey
}