import type {
  LayoutNode,
  LayoutRevision,
  LayoutSource,
  TextLine
} from '../../../interface/Layout'

/** Paragraph spacing advances the flow, but never enlarges selection ink. */
export function getLayoutFlowHeight(node: LayoutNode): number {
  if (node.hidden || (node.kind === 'block' && node.outOfFlow)) return 0
  return (
    node.rect.height +
    (node.kind === 'textLine'
      ? node.spacingBefore + node.spacingAfter
      : node.kind === 'tableFragment'
        ? node.spacingAfter || 0
        : node.kind === 'block'
          ? (node.spacingBefore || 0) + (node.spacingAfter || 0)
          : 0)
  )
}

/** Baseline and node.rect share scope coordinates; no DPR/zoom applied here. */
export function getLayoutBaseline(line: TextLine): number {
  return line.rect.y + line.baseline
}

/** Stale document OR stale font results must not replace the current snapshot. */
export function isCurrentLayoutRevision(
  result: LayoutRevision,
  current: LayoutRevision
): boolean {
  return (
    result.documentRevision === current.documentRevision &&
    result.fontRevision === current.fontRevision
  )
}

/** Scope participates in identity, even when cells reuse local IDs/ranges. */
export function getLayoutSourceKey(source: LayoutSource): string {
  return JSON.stringify([source.scope, source.nodeId, source.start, source.end])
}
