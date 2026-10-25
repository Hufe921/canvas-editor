import type { DisplayList } from '../../model/DisplayList'
import type { IRenderPattern, IRenderSource } from '../../model/RenderContext'
import { PathCompiler } from './PathCompiler'
import {
  buildPatternResourceKey,
  createResourceId,
  getImageSize
} from './ResourceKey'
import type { SceneDefinition, SceneNode, SceneNodeKind } from './SceneNode'

type Matrix = [number, number, number, number, number, number]

interface IPaintState {
  fillStyle: unknown
  strokeStyle: unknown
  font: string
  globalAlpha: number
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
  lineWidth: number
  lineCap: CanvasLineCap
  lineJoin: CanvasLineJoin
  lineDash: number[]
  transform: Matrix
  clipId?: string
}

const TEXT_ANCHOR: Record<CanvasTextAlign, string> = {
  start: 'start',
  left: 'start',
  center: 'middle',
  right: 'end',
  end: 'end'
}

export class SceneCompiler {
  public compile(displayList: DisplayList, resourceScope = 'svg'): SceneNode {
    const root: SceneNode = {
      key: 'root',
      kind: 'group',
      attributes: {},
      children: []
    }
    const stack = [root]
    const ordinals: Map<string, number>[] = [new Map()]
    const clipOrdinals = new Map<SceneNode, number>()
    const patternIds = new Map<SceneNode, Map<string, string>>()
    let state = this._createInitialState()
    const stateStack: IPaintState[] = []
    let path = new PathCompiler()
    const getDefinitionScope = () => {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].kind === 'page') return stack[i]
      }
      return stack[stack.length - 1]
    }
    const resolvePaint = (value: unknown): unknown => {
      if (!this._isRenderPattern(value)) return value
      const scope = getDefinitionScope()
      const resourceKey = buildPatternResourceKey(value)
      let scopePatterns = patternIds.get(scope)
      if (!scopePatterns) {
        scopePatterns = new Map()
        patternIds.set(scope, scopePatterns)
      }
      let id = scopePatterns.get(resourceKey)
      if (!id) {
        id = createResourceId('pattern', resourceKey, resourceScope)
        scopePatterns.set(resourceKey, id)
        const definition: SceneDefinition = {
          key: id,
          kind: 'pattern',
          cacheKey: id,
          attributes: {
            href: value.image,
            ...getImageSize(value.image),
            repetition: value.repetition,
            patternUnits: 'userSpaceOnUse'
          },
          children: []
        }
        ;(scope.defs ||= []).push(definition)
      }
      return `url(#${id})`
    }
    const appendLeaf = (
      kind: SceneNodeKind,
      attributes: Record<string, unknown>,
      source?: IRenderSource,
      localTransform?: Matrix
    ) => {
      const parent = stack[stack.length - 1]
      const counters = ordinals[ordinals.length - 1]
      const ordinal = counters.get(kind) || 0
      counters.set(kind, ordinal + 1)
      const finalAttributes = { ...attributes }
      if (localTransform || state.transform.join(',') !== '1,0,0,1,0,0') {
        const transform = localTransform
          ? this._multiplyMatrix(state.transform, localTransform)
          : state.transform
        finalAttributes.transform = this._serializeMatrix(transform)
      }
      if (state.clipId && !finalAttributes['clip-path']) {
        finalAttributes['clip-path'] = `url(#${state.clipId})`
      }
      const key = `${parent.key}:${
        source ? `source:${source.key}` : `${kind}:${ordinal}`
      }`
      if (parent.children.some(child => child.key === key)) {
        throw new Error(`Duplicate sibling scene key: ${key}`)
      }
      parent.children.push({
        key,
        kind,
        attributes: finalAttributes,
        children: []
      })
    }
    const appendPath = (stroke: boolean) => {
      const d = path.getPathData()
      if (!d) return
      const attributes: Record<string, unknown> = stroke
        ? {
            d,
            fill: 'none',
            stroke: resolvePaint(state.strokeStyle),
            'fill-rule': 'nonzero',
            opacity: state.globalAlpha,
            'stroke-width': state.lineWidth,
            'stroke-linecap': state.lineCap,
            'stroke-linejoin': state.lineJoin,
            'stroke-dasharray': state.lineDash.length
              ? state.lineDash.join(' ')
              : 'none'
          }
        : {
            d,
            fill: resolvePaint(state.fillStyle),
            'fill-rule': 'nonzero',
            opacity: state.globalAlpha
          }
      appendLeaf('path', attributes)
    }
    for (const operation of displayList.getOperations()) {
      if (operation.type === 'beginGroup') {
        let parent = stack[stack.length - 1]
        let node: SceneNode | undefined
        if (operation.kind === 'layer') {
          for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].kind === 'page') {
              parent = stack[i]
              break
            }
          }
          node = parent.children.find(
            child => child.key === operation.key && child.kind === 'layer'
          )
        }
        if (!node) {
          if (parent.children.some(child => child.key === operation.key)) {
            throw new Error(`Duplicate sibling scene key: ${operation.key}`)
          }
          node = {
            key: operation.key,
            kind: operation.kind,
            attributes: {},
            children: []
          }
          parent.children.push(node)
        }
        stack.push(node)
        ordinals.push(new Map())
      } else if (operation.type === 'endGroup') {
        if (stack.length === 1) {
          throw new Error('Unexpected endGroup operation')
        }
        stack.pop()
        ordinals.pop()
      } else if (operation.type === 'set') {
        if (operation.property in state) {
          ;(state as any)[operation.property] = operation.value
        }
      } else if (operation.type === 'save') {
        stateStack.push({
          ...state,
          lineDash: [...state.lineDash],
          transform: [...state.transform]
        })
      } else if (operation.type === 'restore') {
        const previousState = stateStack.pop()
        if (!previousState) {
          throw new Error('Unexpected restore operation')
        }
        state = previousState
      } else if (operation.type === 'setLineDash') {
        state.lineDash = [...(operation.args[0] as number[])]
      } else if (operation.type === 'translate') {
        const [x, y] = operation.args as number[]
        state.transform = this._multiplyMatrix(state.transform, [
          1,
          0,
          0,
          1,
          x,
          y
        ])
      } else if (operation.type === 'scale') {
        const [x, y] = operation.args as number[]
        state.transform = this._multiplyMatrix(state.transform, [
          x,
          0,
          0,
          y,
          0,
          0
        ])
      } else if (operation.type === 'rotate') {
        const [angle] = operation.args as number[]
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        state.transform = this._multiplyMatrix(state.transform, [
          cos,
          sin,
          -sin,
          cos,
          0,
          0
        ])
      } else if (operation.type === 'beginPath') {
        path = new PathCompiler()
      } else if (operation.type === 'moveTo') {
        path.moveTo(...(operation.args as [number, number]))
      } else if (operation.type === 'lineTo') {
        path.lineTo(...(operation.args as [number, number]))
      } else if (operation.type === 'rect') {
        path.rect(...(operation.args as [number, number, number, number]))
      } else if (operation.type === 'closePath') {
        path.closePath()
      } else if (operation.type === 'quadraticCurveTo') {
        path.quadraticCurveTo(
          ...(operation.args as [number, number, number, number])
        )
      } else if (operation.type === 'bezierCurveTo') {
        path.bezierCurveTo(
          ...(operation.args as [
            number,
            number,
            number,
            number,
            number,
            number
          ])
        )
      } else if (operation.type === 'arc') {
        path.arc(
          ...(operation.args as [
            number,
            number,
            number,
            number,
            number,
            boolean?
          ])
        )
      } else if (operation.type === 'fill') {
        appendPath(false)
      } else if (operation.type === 'stroke') {
        appendPath(true)
      } else if (operation.type === 'clip') {
        const scope = getDefinitionScope()
        const ordinal = clipOrdinals.get(scope) || 0
        clipOrdinals.set(scope, ordinal + 1)
        const id = createResourceId(
          'clip',
          `${scope.key}:${ordinal}`,
          resourceScope
        )
        const attributes: Record<string, unknown> = {
          d: path.getPathData(),
          'clip-rule': 'nonzero'
        }
        if (state.transform.join(',') !== '1,0,0,1,0,0') {
          attributes.transform = this._serializeMatrix(state.transform)
        }
        const definition: SceneDefinition = {
          key: id,
          kind: 'clipPath',
          attributes: state.clipId
            ? { intersects: `url(#${state.clipId})` }
            : {},
          children: [
            {
              key: `${id}:path`,
              kind: 'path',
              attributes,
              children: []
            }
          ]
        }
        ;(scope.defs ||= []).push(definition)
        state.clipId = id
      } else if (operation.type === 'fillRect') {
        const [x, y, width, height] = operation.args as number[]
        appendLeaf('rect', {
          x,
          y,
          width,
          height,
          fill: resolvePaint(state.fillStyle),
          opacity: state.globalAlpha
        })
      } else if (operation.type === 'strokeRect') {
        const [x, y, width, height] = operation.args as number[]
        appendLeaf('rect', {
          x,
          y,
          width,
          height,
          fill: 'none',
          stroke: resolvePaint(state.strokeStyle),
          opacity: state.globalAlpha,
          'stroke-width': state.lineWidth,
          'stroke-linecap': state.lineCap,
          'stroke-linejoin': state.lineJoin,
          'stroke-dasharray': state.lineDash.length
            ? state.lineDash.join(' ')
            : 'none'
        })
      } else if (operation.type === 'fillText') {
        const [text, x, y, source] = operation.args as [
          string,
          number,
          number,
          IRenderSource?
        ]
        appendLeaf(
          'text',
          {
            x,
            y,
            text,
            fill: resolvePaint(state.fillStyle),
            opacity: state.globalAlpha,
            font: state.font,
            'dominant-baseline': state.textBaseline,
            'text-anchor': TEXT_ANCHOR[state.textAlign],
            'xml:space': 'preserve'
          },
          source
        )
      } else if (operation.type === 'drawImage') {
        const [image, ...args] = operation.args
        const destination = args.slice(-4) as number[]
        const attributes: Record<string, unknown> = {
          href: image,
          x: destination[0],
          y: destination[1],
          width: destination[2],
          height: destination[3],
          opacity: state.globalAlpha,
          preserveAspectRatio: 'none'
        }
        let localTransform: Matrix | undefined
        if (args.length === 8) {
          const [sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight] =
            args as number[]
          const scaleX = dWidth / sWidth
          const scaleY = dHeight / sHeight
          const size = getImageSize(image as CanvasImageSource)
          attributes.x = 0
          attributes.y = 0
          attributes.width = size.width
          attributes.height = size.height
          localTransform = [
            scaleX,
            0,
            0,
            scaleY,
            dx - sx * scaleX,
            dy - sy * scaleY
          ]
          const scope = getDefinitionScope()
          const ordinal = clipOrdinals.get(scope) || 0
          clipOrdinals.set(scope, ordinal + 1)
          const id = createResourceId(
            'clip',
            `${scope.key}:${ordinal}`,
            resourceScope
          )
          const clipAttributes: Record<string, unknown> = {
            x: dx,
            y: dy,
            width: dWidth,
            height: dHeight
          }
          if (state.transform.join(',') !== '1,0,0,1,0,0') {
            clipAttributes.transform = this._serializeMatrix(state.transform)
          }
          const definition: SceneDefinition = {
            key: id,
            kind: 'clipPath',
            attributes: state.clipId
              ? { intersects: `url(#${state.clipId})` }
              : {},
            children: [
              {
                key: `${id}:rect`,
                kind: 'rect',
                attributes: clipAttributes,
                children: []
              }
            ]
          }
          ;(scope.defs ||= []).push(definition)
          attributes['clip-path'] = `url(#${id})`
        }
        appendLeaf('image', attributes, undefined, localTransform)
      }
    }
    if (stack.length > 1) {
      throw new Error(`Unclosed render group: ${stack[stack.length - 1].key}`)
    }
    if (stateStack.length) {
      throw new Error('Unclosed save operation')
    }
    return root
  }

  private _createInitialState(): IPaintState {
    return {
      fillStyle: '#000000',
      strokeStyle: '#000000',
      font: '10px sans-serif',
      globalAlpha: 1,
      textAlign: 'start',
      textBaseline: 'alphabetic',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      lineDash: [],
      transform: [1, 0, 0, 1, 0, 0]
    }
  }

  private _isRenderPattern(value: unknown): value is IRenderPattern {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      value.type === 'pattern'
    )
  }

  private _multiplyMatrix(left: Matrix, right: Matrix): Matrix {
    const [a, b, c, d, e, f] = left
    const [g, h, i, j, k, l] = right
    return [
      a * g + c * h,
      b * g + d * h,
      a * i + c * j,
      b * i + d * j,
      a * k + c * l + e,
      b * k + d * l + f
    ]
  }

  private _serializeMatrix(matrix: Matrix): string {
    const values = matrix.map(value => (Math.abs(value) < 1e-12 ? 0 : value))
    return `matrix(${values.join(' ')})`
  }
}
