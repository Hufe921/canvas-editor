import { PaperDirection } from '../dataset/enum/Editor'
import { IIframeInfo } from '../interface/Block'

function convertPxToPaperSize(width: number, height: number) {
  if (width === 1125 && height === 1593) {
    return {
      size: 'a3',
      width: '297mm',
      height: '420mm'
    }
  }
  if (width === 794 && height === 1123) {
    return {
      size: 'a4',
      width: '210mm',
      height: '297mm'
    }
  }
  if (width === 565 && height === 796) {
    return {
      size: 'a5',
      width: '148mm',
      height: '210mm'
    }
  }
  // 其他默认不转换
  return {
    size: '',
    width: `${width}px`,
    height: `${height}px`
  }
}

interface IPrintOption {
  width: number
  height: number
  direction?: PaperDirection
  // 混排横竖版：各页纸张方向（缺省页回退到 direction）
  pageDirections?: PaperDirection[]
  iframeInfoList?: IIframeInfo[][]
}

export async function print(base64List: string[], options: IPrintOption) {
  const {
    width,
    height,
    direction = PaperDirection.VERTICAL,
    pageDirections,
    iframeInfoList = []
  } = options
  const iframe = document.createElement('iframe')
  // 离屏渲染
  iframe.style.visibility = 'hidden'
  iframe.style.position = 'absolute'
  iframe.style.left = '0'
  iframe.style.top = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = 'none'
  document.body.append(iframe)
  const contentWindow = iframe.contentWindow!
  const doc = contentWindow.document
  doc.open()
  const container = document.createElement('div')
  const paperSize = convertPxToPaperSize(width, height)
  const getPageDirection = (pageIndex: number) =>
    pageDirections?.[pageIndex] || direction
  const firstPageDirection = getPageDirection(0)
  const lastPageDirection = getPageDirection(base64List.length - 1)
  const isMixedDirection = base64List.some(
    (_, pageIndex) => getPageDirection(pageIndex) !== firstPageDirection
  )
  base64List.forEach((base64, pageIndex) => {
    const pageDirection = getPageDirection(pageIndex)
    const pageWrapper = document.createElement('div')
    pageWrapper.style.position = 'relative'
    pageWrapper.style.width =
      pageDirection === PaperDirection.HORIZONTAL
        ? paperSize.height
        : paperSize.width
    pageWrapper.style.height =
      pageDirection === PaperDirection.HORIZONTAL
        ? paperSize.width
        : paperSize.height
    // 混排时为前 N-1 页指定命名页；最后一页沿用匿名 @page，避免命名页与匿名页
    // 在文档末尾发生 name 切换而触发额外的 forced break（多出一页空白页）
    if (isMixedDirection && pageIndex < base64List.length - 1) {
      pageWrapper.style.setProperty(
        'page',
        pageDirection === PaperDirection.HORIZONTAL
          ? 'canvas-editor-landscape'
          : 'canvas-editor-portrait'
      )
    }
    // 背景图片
    const image = document.createElement('img')
    image.style.width = '100%'
    image.style.height = '100%'
    image.style.position = 'absolute'
    image.style.left = '0'
    image.style.top = '0'
    image.src = base64
    pageWrapper.append(image)
    // 叠加 iframe
    const pageIframes = iframeInfoList[pageIndex] || []
    pageIframes.forEach(iframeInfo => {
      const iframeEl = document.createElement('iframe')
      iframeEl.style.position = 'absolute'
      iframeEl.style.left = `${iframeInfo.x}px`
      iframeEl.style.top = `${iframeInfo.y}px`
      iframeEl.style.width = `${iframeInfo.width}px`
      iframeEl.style.height = `${iframeInfo.height}px`
      iframeEl.style.border = 'none'
      if (iframeInfo.src) {
        iframeEl.src = iframeInfo.src
      } else if (iframeInfo.srcdoc) {
        // 注入脚本到 body 最后
        const script = `
        <script>
          if (!window.__CUSTOM_CANVAS_EDITOR_LOAD_HOOK__) {
            window.postMessage({ type: '__LOADED_TO_CANVAS_EDITOR__' }, '*')
          }
        </script>`
        const srcdoc = iframeInfo.srcdoc
        if (srcdoc.includes('</body>')) {
          iframeEl.srcdoc = srcdoc.replace('</body>', `${script}</body>`)
        } else {
          iframeEl.srcdoc = srcdoc + script
        }
      }
      pageWrapper.append(iframeEl)
    })
    container.append(pageWrapper)
  })
  const style = document.createElement('style')
  const pageRule = isMixedDirection
    ? `
  @page {
    margin: 0;
    size: ${paperSize.size} ${
      lastPageDirection === PaperDirection.HORIZONTAL ? 'landscape' : 'portrait'
    };
  }
  @page canvas-editor-portrait {
    margin: 0;
    size: ${paperSize.size} portrait;
  }
  @page canvas-editor-landscape {
    margin: 0;
    size: ${paperSize.size} landscape;
  }`
    : `
  @page {
    margin: 0;
    size: ${paperSize.size} ${
      firstPageDirection === PaperDirection.HORIZONTAL
        ? 'landscape'
        : 'portrait'
    };
  }`
  const stylesheet = `
  * {
    margin: 0;
    padding: 0;
  }${pageRule}`
  style.append(document.createTextNode(stylesheet))
  doc.write(`${style.outerHTML}${container.innerHTML}`)

  // 等待iframe加载完成
  if (iframeInfoList.length) {
    await waitIframeLoad(doc)
  }

  setTimeout(async () => {
    contentWindow.print()
    doc.close()
    // 移除iframe
    window.addEventListener(
      'mouseover',
      () => {
        iframe?.remove()
      },
      {
        once: true
      }
    )
  })
}

async function waitIframeLoad(doc: Document) {
  const iframeList = Array.from(doc.querySelectorAll('iframe'))

  const iframePromises = iframeList.map(iframe => {
    const iframePromise = new Promise(resolve => {
      // srcdoc需要等待事件（优先使用自定义事件，否则使用注入的脚本事件）
      if (iframe.srcdoc) {
        iframe.contentWindow?.addEventListener('message', e => {
          if (e.data.type === '__LOADED_TO_CANVAS_EDITOR__') {
            resolve(true)
          }
        })
      } else {
        // url不等待直接返回
        resolve(true)
      }
    })
    return iframePromise
  })

  await Promise.allSettled(iframePromises)
}
