import { IBadgeOption } from '../../interface/Badge'

export const defaultBadgeOption: Readonly<Required<IBadgeOption>> = {
  top: 0,
  left: 5,
  /** -1 = unset; right >= 0 enables right anchoring */
  right: -1
}
