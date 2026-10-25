export type SceneGroupKind =
  | 'page'
  | 'layer'
  | 'group'
  | 'row'
  | 'table-fragment'
  | 'repeat-header'

export type SceneNodeKind = SceneGroupKind | 'text' | 'path' | 'rect' | 'image'

export interface ISceneResourceIdentity {
  key: string
  revision?: string | number
}

export interface SceneDefinition {
  key: string
  kind: 'clipPath' | 'pattern'
  attributes: Record<string, unknown>
  children: SceneNode[]
  cacheKey?: string
}

export interface SceneNode {
  key: string
  kind: SceneNodeKind
  attributes: Record<string, unknown>
  children: SceneNode[]
  defs?: SceneDefinition[]
}
