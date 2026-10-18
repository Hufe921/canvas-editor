import { Draw } from '@/editor/core/draw/Draw'
import { mergeOption } from '@/editor/utils/option'
import { testFonts } from './fonts'

/** Build the real HarfBuzz pipeline before exercising layout or commands. */
export async function createTestDraw(
  ...args: ConstructorParameters<typeof Draw>
): Promise<Draw> {
  args[1] = mergeOption({
    ...args[1],
    autoDownloadFonts: false,
    defaultFont: 'Noto Sans',
    fonts: testFonts()
  })
  const draw = new Draw(...args)
  await draw.ready
  return draw
}
