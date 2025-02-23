// 部分浏览器canvas上下文支持设置以下属性
interface CanvasRenderingContext2D {
  letterSpacing: string
  wordSpacing: string
}

declare module '*?worker&inline' {
  class WorkerConstructor extends Worker {
    constructor()
  }
  export default WorkerConstructor
}
