export interface IBadge {
  top?: number
  left?: number
  width: number
  height: number
  value: string
}

export interface IBadgeOption {
  top?: number
  left?: number
}

export interface IAreaBadge {
  areaId: string
  badge: IBadge
}
