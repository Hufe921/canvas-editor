export class ImageObserver {
  private promiseList: Promise<unknown>[]

  constructor() {
    this.promiseList = []
  }

  public add(payload: Promise<unknown>) {
    this.promiseList.push(payload)
  }

  public clearAll() {
    this.promiseList = []
  }

  public allSettled() {
    return Promise.allSettled(this.promiseList)
  }
}
