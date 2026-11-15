import { EDITOR_PREFIX } from '../../../../dataset/constant/Editor'
import { EditorMode } from '../../../../dataset/enum/Editor'
import { ElementType } from '../../../../dataset/enum/Element'
import { IEditorOption } from '../../../../interface/Editor'
import { IElement, IElementPosition } from '../../../../interface/Element'
import { EventBusMap } from '../../../../interface/EventBus'
import {
  IPreviewerCreateResult,
  IPreviewerDrawOption
} from '../../../../interface/Previewer'
import { downloadFile } from '../../../../utils'
import { getRotatedRectSize, normalizeRotation } from '../../../../utils/image'
import { EventBus } from '../../../event/eventbus/EventBus'
import { Draw } from '../../Draw'
import type { RenderPage } from '../../../render/RenderBackend'
import { ImageCropper } from './ImageCropper'

export class Previewer {
  private container: HTMLDivElement
  private canvas: RenderPage
  private draw: Draw
  private options: Required<IEditorOption>
  private curElement: IElement | null
  private curElementSrc: string
  private previewerDrawOption: IPreviewerDrawOption
  private curPosition: IElementPosition | null
  private eventBus: EventBus<EventBusMap>
  // 图片列表
  private imageList: IElement[]
  private curShowElement: IElement | null
  private imageCount: HTMLSpanElement | null
  private imagePre: HTMLElement | null
  private imageNext: HTMLElement | null
  // 拖拽改变尺寸及旋转
  private resizerSelection: HTMLDivElement
  private resizerHandleList: HTMLDivElement[]
  private resizerRotateHandle: HTMLDivElement
  private resizerImageContainer: HTMLDivElement
  private resizerImage: HTMLImageElement
  private resizerSize: HTMLSpanElement
  private width: number
  private height: number
  private mousedownX: number
  private mousedownY: number
  private curHandleIndex: number
  private rotation: number
  private startRotation: number
  private startPointerAngle: number
  private rotationCenterX: number
  private rotationCenterY: number
  // 预览选区
  private previewerContainer: HTMLDivElement | null
  private previewerImage: HTMLImageElement | null
  private previewerCropper: ImageCropper | null

  constructor(draw: Draw) {
    this.container = draw.getContainer()
    this.canvas = draw.getPage()
    this.draw = draw
    this.options = draw.getOptions()
    this.curElement = null
    this.curElementSrc = ''
    this.previewerDrawOption = {}
    this.curPosition = null
    this.eventBus = draw.getEventBus()
    this.imageList = []
    this.curShowElement = null
    this.imageCount = null
    this.imagePre = null
    this.imageNext = null
    // 图片尺寸缩放及旋转
    const {
      resizerSelection,
      resizerHandleList,
      resizerRotateHandle,
      resizerImageContainer,
      resizerImage,
      resizerSize
    } = this._createResizerDom()
    this.resizerSelection = resizerSelection
    this.resizerHandleList = resizerHandleList
    this.resizerRotateHandle = resizerRotateHandle
    this.resizerImageContainer = resizerImageContainer
    this.resizerImage = resizerImage
    this.resizerSize = resizerSize
    this.width = 0
    this.height = 0
    this.mousedownX = 0
    this.mousedownY = 0
    this.curHandleIndex = 0 // 默认右下角
    this.rotation = 0
    this.startRotation = 0
    this.startPointerAngle = 0
    this.rotationCenterX = 0
    this.rotationCenterY = 0
    this.previewerContainer = null
    this.previewerImage = null
    this.previewerCropper = null
  }

  private _getElementPosition(
    element: IElement,
    position: IElementPosition | null = null
  ): { x: number; y: number } {
    let x = 0
    let y = 0
    const pageNo = position?.pageNo ?? this.draw.getPageNo()
    const { x: preX, y: preY } = this.draw.getPageOffset(pageNo)
    // 优先使用浮动位置
    if (element.imgFloatPosition) {
      const position = this.draw.getPosition()
      const floatPosition = position.getFloatPositionByElement(element)
      if (floatPosition) {
        const coordinate = position.getFloatPositionCoordinate(floatPosition)
        x = coordinate.x + preX
        y = coordinate.y + preY
      }
    } else if (position) {
      const {
        coordinate: {
          leftTop: [left, top]
        },
        ascent
      } = position
      x = left + preX
      y = top + preY + ascent
      if (element.imgRotation) {
        const { scale } = this.options
        const width = element.width! * scale
        const height = element.height! * scale
        const rotatedSize = getRotatedRectSize(
          width,
          height,
          element.imgRotation
        )
        x += (rotatedSize.width - width) / 2
        y += (rotatedSize.height - height) / 2
      }
    }
    return { x, y }
  }

  private _createResizerDom(): IPreviewerCreateResult {
    const { scale } = this.options
    // 拖拽边框
    const resizerSelection = document.createElement('div')
    resizerSelection.classList.add(`${EDITOR_PREFIX}-resizer-selection`)
    resizerSelection.style.display = 'none'
    resizerSelection.style.borderColor = this.options.resizerColor
    resizerSelection.style.borderWidth = `${scale}px`
    resizerSelection.style.transformOrigin = 'center center'
    // 拖拽点
    const resizerHandleList: HTMLDivElement[] = []
    for (let i = 0; i < 8; i++) {
      const handleDom = document.createElement('div')
      handleDom.style.background = this.options.resizerColor
      handleDom.classList.add(`resizer-handle`)
      handleDom.classList.add(`handle-${i}`)
      handleDom.setAttribute('data-index', String(i))
      handleDom.onmousedown = this._mousedown.bind(this)
      resizerSelection.append(handleDom)
      resizerHandleList.push(handleDom)
    }
    // 旋转手柄
    const resizerRotateHandle = document.createElement('div')
    resizerRotateHandle.classList.add('resizer-rotate-handle')
    resizerRotateHandle.setAttribute('aria-label', 'Rotate image')
    resizerRotateHandle.onmousedown = this._rotationMousedown.bind(this)
    resizerSelection.append(resizerRotateHandle)
    this.container.append(resizerSelection)
    // 尺寸查看
    const resizerSizeView = document.createElement('div')
    resizerSizeView.classList.add(`${EDITOR_PREFIX}-resizer-size-view`)
    const resizerSize = document.createElement('span')
    resizerSizeView.append(resizerSize)
    resizerSelection.append(resizerSizeView)
    // 拖拽镜像
    const resizerImageContainer = document.createElement('div')
    resizerImageContainer.classList.add(`${EDITOR_PREFIX}-resizer-image`)
    resizerImageContainer.style.display = 'none'
    resizerImageContainer.style.overflow = 'hidden'
    resizerImageContainer.style.transformOrigin = 'center center'
    const resizerImage = document.createElement('img')
    resizerImage.style.position = 'absolute'
    resizerImage.onload = () => {
      const width = parseFloat(resizerImageContainer.style.width)
      const height = parseFloat(resizerImageContainer.style.height)
      if (width && height) this._setResizerImageSize(width, height)
    }
    resizerImageContainer.append(resizerImage)
    this.container.append(resizerImageContainer)
    return {
      resizerSelection,
      resizerHandleList,
      resizerRotateHandle,
      resizerImageContainer,
      resizerImage,
      resizerSize
    }
  }

  private _keydown = () => {
    // 有键盘事件触发时，主动销毁拖拽选区
    if (this.resizerSelection.style.display === 'block') {
      this.clearResizer()
      document.removeEventListener('keydown', this._keydown)
    }
  }

  private _mousedown(evt: MouseEvent) {
    this.canvas = this.draw.getPage()
    if (!this.curElement) return
    const { scale } = this.options
    this.mousedownX = evt.x
    this.mousedownY = evt.y
    const target = evt.target as HTMLDivElement
    this.curHandleIndex = Number(target.dataset.index)
    // 改变光标
    const cursor = window.getComputedStyle(target).cursor
    document.body.style.cursor = cursor
    this.canvas.style.cursor = cursor
    // 拖拽图片镜像
    this.resizerImage.src = this.curElementSrc
    this.resizerImageContainer.style.display = 'block'
    // 优先使用浮动位置信息
    const { x: resizerLeft, y: resizerTop } = this._getElementPosition(
      this.curElement,
      this.curPosition
    )
    this.resizerImageContainer.style.left = `${resizerLeft}px`
    this.resizerImageContainer.style.top = `${resizerTop}px`
    this._setResizerImageSize(
      this.curElement.width! * scale,
      this.curElement.height! * scale
    )
    this._setResizerRotation(this.rotation)
    // 追加全局事件
    const mousemoveFn = this._mousemove.bind(this)
    document.addEventListener('mousemove', mousemoveFn)
    document.addEventListener(
      'mouseup',
      () => {
        // 改变尺寸
        if (this.curElement && !this.previewerDrawOption.dragDisable) {
          this.curElement.width = this.width
          this.curElement.height = this.height
          this.draw.render({
            isSetCursor: true,
            curIndex: this.curPosition?.index
          })
        }
        // 还原副作用
        this.resizerImageContainer.style.display = 'none'
        document.removeEventListener('mousemove', mousemoveFn)
        document.body.style.cursor = ''
        this.canvas.style.cursor = 'text'
      },
      {
        once: true
      }
    )
    evt.preventDefault()
  }

  private _rotationMousedown(evt: MouseEvent) {
    if (
      !this.curElement ||
      this.curElement.type !== ElementType.IMAGE ||
      this.previewerDrawOption.dragDisable
    ) {
      return
    }
    this.canvas = this.draw.getPage()
    const { scale } = this.options
    const { x, y } = this._getElementPosition(this.curElement, this.curPosition)
    const containerRect = this.container.getBoundingClientRect()
    this.rotationCenterX =
      containerRect.left + x + (this.curElement.width! * scale) / 2
    this.rotationCenterY =
      containerRect.top + y + (this.curElement.height! * scale) / 2
    this.startPointerAngle =
      (Math.atan2(evt.y - this.rotationCenterY, evt.x - this.rotationCenterX) *
        180) /
      Math.PI
    this.startRotation = this.rotation
    document.body.style.cursor = 'grabbing'
    this.canvas.style.cursor = 'grabbing'
    // 拖拽图片镜像
    this.resizerImage.src = this.curElementSrc
    this._setResizerImageSize(
      this.curElement.width! * scale,
      this.curElement.height! * scale
    )
    this.resizerImageContainer.style.left = `${x}px`
    this.resizerImageContainer.style.top = `${y}px`
    this.resizerImageContainer.style.display = 'block'
    this._setResizerRotation(this.rotation)
    const mousemoveFn = this._rotationMousemove.bind(this)
    document.addEventListener('mousemove', mousemoveFn)
    document.addEventListener(
      'mouseup',
      () => {
        if (this.curElement && !this.previewerDrawOption.dragDisable) {
          const rotation = Number(this.rotation.toFixed(2))
          if (rotation) {
            this.curElement.imgRotation = rotation
          } else {
            delete this.curElement.imgRotation
          }
          this.draw.render({
            isSetCursor: true,
            curIndex: this.curPosition?.index
          })
        }
        this.resizerImageContainer.style.display = 'none'
        document.removeEventListener('mousemove', mousemoveFn)
        document.body.style.cursor = ''
        this.canvas.style.cursor = 'text'
      },
      { once: true }
    )
    evt.preventDefault()
    evt.stopPropagation()
  }

  private _rotationMousemove(evt: MouseEvent) {
    if (!this.curElement || this.previewerDrawOption.dragDisable) return
    const pointerAngle =
      (Math.atan2(evt.y - this.rotationCenterY, evt.x - this.rotationCenterX) *
        180) /
      Math.PI
    let rotation = normalizeRotation(
      this.startRotation + pointerAngle - this.startPointerAngle
    )
    if (evt.shiftKey) {
      // 按住 Shift 时按 45 度吸附
      rotation = normalizeRotation(Math.round(rotation / 45) * 45)
    } else {
      // 接近直角时自动吸附，便于恢复水平或垂直状态
      const nearestRightAngle = normalizeRotation(
        Math.round(rotation / 90) * 90
      )
      const snapDistance = Math.abs(
        ((rotation - nearestRightAngle + 540) % 360) - 180
      )
      if (snapDistance <= 5) rotation = nearestRightAngle
    }
    this.rotation = rotation
    this._setResizerRotation(rotation)
    const { scale } = this.options
    this._updateResizerSizeView(
      this.curElement.width! * scale,
      this.curElement.height! * scale,
      rotation
    )
    evt.preventDefault()
  }

  private _setResizerImageSize(width: number, height: number) {
    this.resizerImageContainer.style.width = `${width}px`
    this.resizerImageContainer.style.height = `${height}px`
    const crop = this.curElement?.imgCrop
    const { naturalWidth, naturalHeight } = this.resizerImage
    if (crop && naturalWidth && naturalHeight) {
      const scaleX = width / crop.width
      const scaleY = height / crop.height
      this.resizerImage.style.width = `${naturalWidth * scaleX}px`
      this.resizerImage.style.height = `${naturalHeight * scaleY}px`
      this.resizerImage.style.left = `${-crop.x * scaleX}px`
      this.resizerImage.style.top = `${-crop.y * scaleY}px`
    } else {
      this.resizerImage.style.width = `${width}px`
      this.resizerImage.style.height = `${height}px`
      this.resizerImage.style.left = '0px'
      this.resizerImage.style.top = '0px'
    }
  }

  private _setResizerRotation(rotation: number) {
    const transform = `rotate(${rotation}deg)`
    this.resizerSelection.style.transform = transform
    this.resizerImageContainer.style.transform = transform
  }

  private _mousemove(evt: MouseEvent) {
    if (!this.curElement || this.previewerDrawOption.dragDisable) return
    const { scale } = this.options
    // 将屏幕位移转换到图片自身坐标系，旋转后拖动手柄仍沿图片边缘缩放
    const movementX = evt.x - this.mousedownX
    const movementY = evt.y - this.mousedownY
    const radian = (this.rotation * Math.PI) / 180
    const cos = Math.cos(radian)
    const sin = Math.sin(radian)
    const localMovementX = movementX * cos + movementY * sin
    const localMovementY = -movementX * sin + movementY * cos
    let dx = 0
    let dy = 0
    switch (this.curHandleIndex) {
      case 0:
        {
          const offsetX = -localMovementX
          const offsetY = -localMovementY
          dx = Math.cbrt(offsetX ** 3 + offsetY ** 3)
          dy = (this.curElement.height! * dx) / this.curElement.width!
        }
        break
      case 1:
        dy = -localMovementY
        break
      case 2:
        {
          const offsetX = localMovementX
          const offsetY = -localMovementY
          dx = Math.cbrt(offsetX ** 3 + offsetY ** 3)
          dy = (this.curElement.height! * dx) / this.curElement.width!
        }
        break
      case 4:
        {
          const offsetX = localMovementX
          const offsetY = localMovementY
          dx = Math.cbrt(offsetX ** 3 + offsetY ** 3)
          dy = (this.curElement.height! * dx) / this.curElement.width!
        }
        break
      case 3:
        dx = localMovementX
        break
      case 5:
        dy = localMovementY
        break
      case 6:
        {
          const offsetX = -localMovementX
          const offsetY = localMovementY
          dx = Math.cbrt(offsetX ** 3 + offsetY ** 3)
          dy = (this.curElement.height! * dx) / this.curElement.width!
        }
        break
      case 7:
        dx = -localMovementX
        break
    }
    // 图片实际宽高（变化大小除掉缩放比例）
    const dw = this.curElement.width! + dx / scale
    const dh = this.curElement.height! + dy / scale
    if (dw <= 0 || dh <= 0) return
    this.width = dw
    this.height = dh
    // 图片显示宽高
    const elementWidth = dw * scale
    const elementHeight = dh * scale
    // 更新影子图片尺寸
    this._setResizerImageSize(elementWidth, elementHeight)
    // 更新预览包围框尺寸
    this._updateResizerRect(elementWidth, elementHeight)
    // 尺寸预览
    this._updateResizerSizeView(elementWidth, elementHeight)
    evt.preventDefault()
    // 图片尺寸发生改变事件
    if (this.eventBus.isSubscribe('imageSizeChange')) {
      this.eventBus.emit('imageSizeChange', {
        element: this.curElement
      })
    }
  }

  private _drawPreviewer() {
    const previewerContainer = document.createElement('div')
    previewerContainer.classList.add(`${EDITOR_PREFIX}-image-previewer`)
    // 关闭按钮
    const closeBtn = document.createElement('i')
    closeBtn.classList.add('image-close')
    closeBtn.onclick = () => {
      this._clearPreviewer()
    }
    previewerContainer.append(closeBtn)
    // 图片
    const imgContainer = document.createElement('div')
    imgContainer.classList.add(`${EDITOR_PREFIX}-image-container`)
    const img = document.createElement('img')
    img.src = this.curElementSrc
    img.draggable = false
    imgContainer.append(img)
    this.previewerImage = img
    previewerContainer.append(imgContainer)
    // 操作栏
    let x = 0
    let y = 0
    let scaleSize = 1
    let rotateSize = 0
    let isCropWaiting = false
    let previewTransform: {
      x: number
      y: number
      scaleSize: number
      rotateSize: number
    } | null = null
    const menuContainer = document.createElement('div')
    menuContainer.classList.add(`${EDITOR_PREFIX}-image-menu`)
    // 切换上下张图片
    const navigateContainer = document.createElement('div')
    navigateContainer.classList.add('image-navigate')
    const imagePre = document.createElement('i')
    imagePre.classList.add('image-pre')
    imagePre.onclick = () => {
      const curIndex = this.imageList.findIndex(
        el => el.id === this.curShowElement?.id
      )
      if (curIndex <= 0) return
      this.curShowElement = this.imageList[curIndex - 1]
      img.src = this.curShowElement.value
      this._updateImageNavigate()
    }
    navigateContainer.append(imagePre)
    this.imagePre = imagePre
    const imageCount = document.createElement('span')
    imageCount.classList.add('image-count')
    this.imageCount = imageCount
    navigateContainer.append(imageCount)
    const imageNext = document.createElement('i')
    imageNext.classList.add('image-next')
    imageNext.onclick = () => {
      const curIndex = this.imageList.findIndex(
        el => el.id === this.curShowElement?.id
      )
      if (curIndex >= this.imageList.length - 1) return
      this.curShowElement = this.imageList[curIndex + 1]
      img.src = this.curShowElement.value
      this._updateImageNavigate()
    }
    this.imageNext = imageNext
    navigateContainer.append(imageNext)
    menuContainer.append(navigateContainer)
    // 缩放
    const zoomIn = document.createElement('i')
    zoomIn.classList.add('zoom-in')
    zoomIn.onclick = () => {
      scaleSize += 0.1
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
    }
    menuContainer.append(zoomIn)
    const zoomOut = document.createElement('i')
    zoomOut.onclick = () => {
      if (scaleSize - 0.1 <= 0.1) return
      scaleSize -= 0.1
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
    }
    zoomOut.classList.add('zoom-out')
    menuContainer.append(zoomOut)
    // 旋转
    const rotate = document.createElement('i')
    rotate.classList.add('rotate')
    rotate.onclick = () => {
      rotateSize += 1
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
    }
    menuContainer.append(rotate)
    // 裁剪
    const crop = document.createElement('i')
    crop.classList.add('image-crop')
    crop.title = 'Crop image'
    crop.setAttribute('aria-label', 'Crop image')
    crop.style.display =
      this.draw.isReadonly() || this.previewerDrawOption.dragDisable
        ? 'none'
        : 'inline-block'
    crop.onclick = () => {
      if (isCropWaiting || this.previewerCropper) return
      if (!img.naturalWidth || !img.naturalHeight) {
        isCropWaiting = true
        img.addEventListener(
          'load',
          () => {
            isCropWaiting = false
            startCrop()
          },
          { once: true }
        )
        return
      }
      startCrop()
    }
    menuContainer.append(crop)
    // 恢复原始大小
    const originalSize = document.createElement('i')
    originalSize.classList.add('original-size')
    originalSize.onclick = () => {
      x = 0
      y = 0
      scaleSize = 1
      rotateSize = 0
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
    }
    menuContainer.append(originalSize)
    // 下载图片
    const imageDownload = document.createElement('i')
    imageDownload.classList.add('image-download')
    imageDownload.onclick = () => {
      const { mime } = this.previewerDrawOption
      downloadFile(img.src, `${this.curElement?.id}.${mime || 'png'}`)
    }
    menuContainer.append(imageDownload)
    previewerContainer.append(menuContainer)
    // 裁剪操作栏
    const cropMenuContainer = document.createElement('div')
    cropMenuContainer.classList.add(
      `${EDITOR_PREFIX}-image-menu`,
      `${EDITOR_PREFIX}-image-crop-menu`
    )
    cropMenuContainer.style.display = 'none'
    const cropConfirm = document.createElement('i')
    cropConfirm.classList.add('crop-confirm')
    cropConfirm.title = 'Apply crop'
    cropConfirm.setAttribute('aria-label', 'Apply crop')
    cropMenuContainer.append(cropConfirm)
    const cropCancel = document.createElement('i')
    cropCancel.classList.add('crop-cancel')
    cropCancel.title = 'Cancel crop'
    cropCancel.setAttribute('aria-label', 'Cancel crop')
    cropMenuContainer.append(cropCancel)
    previewerContainer.append(cropMenuContainer)
    this.previewerContainer = previewerContainer
    document.body.append(previewerContainer)

    const startCrop = () => {
      const element = this.curShowElement
      if (
        !element ||
        this.previewerContainer !== previewerContainer ||
        this.previewerCropper ||
        this.draw.isReadonly() ||
        this.previewerDrawOption.dragDisable
      ) {
        return
      }
      previewTransform = { x, y, scaleSize, rotateSize }
      x = 0
      y = 0
      scaleSize = 1
      rotateSize = 0
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
      imgContainer.classList.add('cropping')
      this.previewerCropper = new ImageCropper(
        imgContainer,
        img,
        element.imgCrop
      )
      menuContainer.style.display = 'none'
      cropMenuContainer.style.display = 'flex'
    }

    const cancelCrop = () => {
      this.previewerCropper?.destroy()
      this.previewerCropper = null
      imgContainer.classList.remove('cropping')
      cropMenuContainer.style.display = 'none'
      menuContainer.style.display = 'flex'
      if (previewTransform) {
        x = previewTransform.x
        y = previewTransform.y
        scaleSize = previewTransform.scaleSize
        rotateSize = previewTransform.rotateSize
        this._setPreviewerTransform(scaleSize, rotateSize, x, y)
        previewTransform = null
      }
    }

    const applyCrop = () => {
      const element = this.curShowElement
      const cropper = this.previewerCropper
      if (!element || !cropper) return
      const crop = cropper.getCrop()
      const previousCrop = cropper.getInitialCrop()
      element.width = (element.width! * crop.width) / previousCrop.width
      element.height = (element.height! * crop.height) / previousCrop.height
      if (
        crop.x === 0 &&
        crop.y === 0 &&
        crop.width === img.naturalWidth &&
        crop.height === img.naturalHeight
      ) {
        delete element.imgCrop
      } else {
        element.imgCrop = crop
      }
      this._clearPreviewer()
      this.draw.render({
        isSetCursor: true,
        curIndex: this.curPosition?.index
      })
    }
    cropConfirm.onclick = applyCrop
    cropCancel.onclick = cancelCrop

    // 拖拽调整位置
    let startX = 0
    let startY = 0
    let isAllowDrag = false
    img.onmousedown = evt => {
      isAllowDrag = true
      startX = evt.x
      startY = evt.y
      previewerContainer.style.cursor = 'move'
    }
    previewerContainer.onmousemove = (evt: MouseEvent) => {
      if (!isAllowDrag) return
      x += evt.x - startX
      y += evt.y - startY
      startX = evt.x
      startY = evt.y
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
    }
    previewerContainer.onmouseup = () => {
      isAllowDrag = false
      previewerContainer.style.cursor = 'auto'
    }
    previewerContainer.onwheel = evt => {
      if (this.previewerCropper) return
      evt.preventDefault()
      evt.stopPropagation()
      if (evt.deltaY < 0) {
        // 放大
        scaleSize += 0.1
      } else {
        // 缩小
        if (scaleSize - 0.1 <= 0.1) return
        scaleSize -= 0.1
      }
      this._setPreviewerTransform(scaleSize, rotateSize, x, y)
    }
    // 更新图片索引信息
    this._updateImageNavigate()
  }

  private _updateImageNavigate() {
    // 更新当前图片位置索引
    const currentIndex = this.imageList.findIndex(
      el => el.id === this.curShowElement?.id
    )
    this.imageCount!.innerText = `${currentIndex + 1} / ${
      this.imageList.length
    }`
    // 更新按钮权限
    if (currentIndex <= 0) {
      this.imagePre!.classList.add('disabled')
    } else {
      this.imagePre!.classList.remove('disabled')
    }
    if (currentIndex >= this.imageList.length - 1) {
      this.imageNext!.classList.add('disabled')
    } else {
      this.imageNext!.classList.remove('disabled')
    }
  }

  public _setPreviewerTransform(
    scale: number,
    rotate: number,
    x: number,
    y: number
  ) {
    if (!this.previewerImage) return
    this.previewerImage.style.left = `${x}px`
    this.previewerImage.style.top = `${y}px`
    this.previewerImage.style.transform = `scale(${scale}) rotate(${
      rotate * 90
    }deg)`
  }

  private _clearPreviewer() {
    this.previewerCropper?.destroy()
    this.previewerCropper = null
    this.previewerContainer?.remove()
    this.previewerContainer = null
    document.body.style.overflow = 'auto'
  }

  public _updateResizerRect(width: number, height: number) {
    const { resizerSize: handleSize, scale } = this.options
    const isReadonly = this.draw.isReadonly()
    this.resizerSelection.style.width = `${width}px`
    this.resizerSelection.style.height = `${height}px`
    // handle
    for (let i = 0; i < 8; i++) {
      const left =
        i === 0 || i === 6 || i === 7
          ? -handleSize
          : i === 1 || i === 5
            ? width / 2
            : width - handleSize
      const top =
        i === 0 || i === 1 || i === 2
          ? -handleSize
          : i === 3 || i === 7
            ? height / 2 - handleSize
            : height - handleSize
      this.resizerHandleList[i].style.transform = `scale(${scale})`
      this.resizerHandleList[i].style.left = `${left}px`
      this.resizerHandleList[i].style.top = `${top}px`
      this.resizerHandleList[i].style.display = isReadonly ? 'none' : 'block'
    }
    this.resizerRotateHandle.style.left = `${width / 2 - 10}px`
    this.resizerRotateHandle.style.top = '-36px'
    this.resizerRotateHandle.style.transform = `scale(${scale})`
  }

  public _updateResizerSizeView(
    width: number,
    height: number,
    rotation = this.rotation
  ) {
    const { width: rotatedWidth, height: rotatedHeight } = getRotatedRectSize(
      width,
      height,
      rotation
    )
    this.resizerSize.innerText = `${Math.round(rotatedWidth)} × ${Math.round(
      rotatedHeight
    )}`
  }

  public render() {
    // 图片工具配置禁用又非设计模式时不渲染
    const mode = this.draw.getMode()
    if (
      !this.curElement ||
      (this.curElement.imgToolDisabled && !this.draw.isDesignMode()) ||
      (mode === EditorMode.PRINT &&
        this.options.modeRule[EditorMode.PRINT]?.imagePreviewerDisabled) ||
      (mode === EditorMode.READONLY &&
        this.options.modeRule[EditorMode.READONLY]?.imagePreviewerDisabled)
    ) {
      return
    }
    // 获取所有图片
    this.imageList = this.draw.getImageParticle().getOriginalMainImageList()
    this.curShowElement = this.curElement
    // 渲染预览框
    this._drawPreviewer()
    document.body.style.overflow = 'hidden'
  }

  public drawResizer(
    element: IElement,
    position: IElementPosition | null = null,
    options: IPreviewerDrawOption = {}
  ) {
    // 图片工具配置禁用又非设计模式时不渲染
    const mode = this.draw.getMode()
    if (
      (element.imgToolDisabled && !this.draw.isDesignMode()) ||
      (mode === EditorMode.PRINT &&
        this.options.modeRule[EditorMode.PRINT]?.imagePreviewerDisabled) ||
      (mode === EditorMode.READONLY &&
        this.options.modeRule[EditorMode.READONLY]?.imagePreviewerDisabled)
    ) {
      return
    }
    // 缓存配置
    this.previewerDrawOption = options
    this.curElementSrc = element[options.srcKey || 'value'] || ''
    // 更新渲染尺寸及位置
    this.updateResizer(element, position)
    // 监听事件
    document.addEventListener('keydown', this._keydown)
  }

  public updateResizer(
    element: IElement,
    position: IElementPosition | null = null
  ) {
    const { scale } = this.options
    const elementWidth = element.width! * scale
    const elementHeight = element.height! * scale
    this.rotation = normalizeRotation(element.imgRotation || 0)
    // 优先使用浮动位置信息
    const { x: resizerLeft, y: resizerTop } = this._getElementPosition(
      element,
      position
    )
    this.resizerSelection.style.left = `${resizerLeft}px`
    this.resizerSelection.style.top = `${resizerTop}px`
    this.resizerSelection.style.borderWidth = `${scale}px`
    this._setResizerRotation(this.rotation)
    this.resizerRotateHandle.style.display =
      element.type === ElementType.IMAGE &&
      !this.draw.isReadonly() &&
      !this.previewerDrawOption.dragDisable
        ? 'block'
        : 'none'
    // 更新预览包围框尺寸
    this._updateResizerRect(elementWidth, elementHeight)
    this.resizerSelection.style.display = 'block'
    // 缓存基础信息
    this.curElement = element
    this.curPosition = position
    this.width = elementWidth
    this.height = elementHeight
    // 尺寸提示需在选框尺寸和角度更新后执行
    this._updateResizerSizeView(elementWidth, elementHeight)
  }

  public clearResizer() {
    this.resizerSelection.style.display = 'none'
    document.removeEventListener('keydown', this._keydown)
  }
}
