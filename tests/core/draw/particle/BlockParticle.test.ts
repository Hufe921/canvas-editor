import { afterEach, describe, expect, it, vi } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { BlockParticle } from '@/editor/core/draw/particle/block/BlockParticle'
import { BaseBlock } from '@/editor/core/draw/particle/block/modules/BaseBlock'
import { DisplayList } from '@/editor/core/render/model/DisplayList'
import { BlockType } from '@/editor/dataset/enum/Block'
import { ElementType } from '@/editor/dataset/enum/Element'
import { IRowElement } from '@/editor/interface/Row'

describe('BaseBlock', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('首次视频异步加载后请求重渲染且不向旧 DisplayList 补画', async () => {
    let video: HTMLVideoElement | undefined
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(
      function (this: HTMLMediaElement) {
        video = this as HTMLVideoElement
        return Promise.resolve()
      }
    )
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    const render = vi.fn()
    let snapshotPromise: Promise<unknown> | undefined
    const draw = {
      getOptions: () => ({ scale: 1, resizerColor: '#000000' }),
      getImageObserver: () => ({
        add: (promise: Promise<unknown>) => {
          snapshotPromise = promise
        }
      }),
      render
    } as unknown as Draw
    const blockParticle = {
      getDraw: () => draw,
      getBlockContainer: () => document.createElement('div')
    } as unknown as BlockParticle
    const element: IRowElement = {
      id: 'video-block',
      type: ElementType.BLOCK,
      value: '',
      style: '',
      block: {
        type: BlockType.VIDEO,
        videoBlock: { src: 'https://example.com/video.mp4' }
      },
      metrics: {
        width: 100,
        height: 50,
        boundingBoxAscent: 0,
        boundingBoxDescent: 0
      }
    }
    const baseBlock = new BaseBlock(blockParticle, element)
    const displayList = new DisplayList()

    baseBlock.snapshot(displayList, 0, 10, 20)
    const loadedVideo = video!
    loadedVideo.dispatchEvent(new Event('loadeddata'))
    await snapshotPromise

    expect(render).toHaveBeenCalledWith({
      isCompute: false,
      isSetCursor: false,
      isSubmitHistory: false
    })
    expect(displayList.getOperations()).toEqual([])

    const cachedDisplayList = new DisplayList()
    baseBlock.snapshot(cachedDisplayList, 0, 10, 20)
    await Promise.resolve()

    expect(cachedDisplayList.getOperations()).toEqual([
      { type: 'drawImage', args: [video, 10, 20, 100, 50] }
    ])
    expect(render).toHaveBeenCalledTimes(1)
  })
})
