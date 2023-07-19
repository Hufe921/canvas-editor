import { TitleLevel } from '../dataset/enum/Title'

export interface ICatalogItem {
  id: string
  name: string
  level: TitleLevel
  subCatalog: ICatalogItem[]
}

export type ICatalog = ICatalogItem[]
