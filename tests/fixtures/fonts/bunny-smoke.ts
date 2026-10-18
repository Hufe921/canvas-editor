import { BunnyFontProvider } from '../../../src/editor/core/text-engine/font/bunny/BunnyFontProvider'
import { FontManager } from '../../../src/editor/core/text-engine/font/FontManager'
import type { FontCoverageIssue } from '../../../src/editor/interface/FontCoverage'

/** Opt-in live integration check; these are fixed test samples, never editor content. */
export async function verifyBunnyFonts() {
  const provider = new BunnyFontProvider()
  const results = []
  for (const [script, text] of [
    ['latn', 'Hello'],
    ['hani', '你好中国Hello'],
    ['arab', 'مرحبا'],
    ['deva', 'नमस्ते'],
    ['thai', 'สวัสดี']
  ]) {
    const gap: FontCoverageIssue = {
      id: 'smoke',
      reason: 'missingGlyph',
      script,
      categoryLabel: script,
      requestedFamily: 'Smoke',
      attemptedFaces: [],
      missingCharacters: [...text],
      missingSequences: [text],
      codePoints: [],
      samples: [text],
      uniqueCount: 1,
      occurrenceCount: 1,
      locations: [],
      downloadStatus: 'idle',
      attemptedDownloads: []
    }
    const plan = await provider.plan(gap)
    if (plan.status !== 'ready')
      throw new Error(`${script}: ${JSON.stringify(plan)}`)
    const manager = new FontManager()
    const resources = []
    try {
      await manager.init([])
      const requested = plan.resources.flatMap(resource => {
        const woff =
          script === 'arab'
            ? resource.sources.find(source => source.format === 'woff')
            : undefined
        return woff
          ? [
              resource,
              {
                ...resource,
                ...woff,
                resourceId: `${resource.resourceId}:woff`
              }
            ]
          : [resource]
      })
      for (const resource of requested) {
        const result = await provider.download(resource)
        if (result.status !== 'loaded')
          throw new Error(`${script}: ${JSON.stringify(result)}`)
        const registered = await manager.registerFace(result.face)
        if (registered.status !== 'registered')
          throw new Error(`${script}: ${JSON.stringify(registered)}`)
        resources.push({
          subset: resource.subset,
          url: result.metadata.url,
          sourceFormat: result.sourceFormat,
          format: result.format,
          bytes: result.face.data!.byteLength,
          contentType: result.metadata.contentType,
          etag: result.metadata.etag,
          lastModified: result.metadata.lastModified,
          cacheControl: result.metadata.cacheControl,
          version: result.metadata.version
        })
      }
      const resolved = manager.resolveText(
        { fontFamily: plan.candidate.family, fontSize: 20 },
        text
      )
      if (!resolved.every(run => run.resolution.covered))
        throw new Error(
          `${script}: downloaded fonts do not cover the fixed sample`
        )
      // resolve/checkCoverage executes real HB shaping and verifies outline paths.
      results.push({
        script,
        covered: true,
        faceCount: manager.getFaces().length,
        css: plan.metadata,
        warnings: plan.warnings,
        resources
      })
    } finally {
      manager.destroy()
    }
  }
  return results
}
