export interface IBadge {
  top?: number
  left?: number
  /** Distance from page right edge; when >= 0, overrides left */
  right?: number
  width: number
  height: number
  value: string
}

export interface IBadgeOption {
  top?: number
  left?: number
  /** Default right inset; -1 means unset (use left) */
  right?: number
}

export interface IAreaBadge {
  areaId: string
  badge: IBadge
}
