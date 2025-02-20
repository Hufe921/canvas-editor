import { Draw } from '../draw/Draw'
import WordCountWorker from './works/wordCount.worker?worker&inline'
import CatalogWorker from './works/catalog.worker?worker&inline'
import GroupWorker from './works/group.worker?worker&inline'
import { ICatalog } from '../../interface/Catalog'

export class WorkerManager {
  private draw: Draw
  private wordCountWorker: Worker
  private catalogWorker: Worker
  private groupWorker: Worker

  constructor(draw: Draw) {
    this.draw = draw
    this.wordCountWorker = new WordCountWorker() as Worker
    this.catalogWorker = new CatalogWorker() as Worker
    this.groupWorker = new GroupWorker() as Worker
  }

  public getWordCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.wordCountWorker.onmessage = evt => {
        resolve(evt.data)
      }

      this.wordCountWorker.onerror = evt => {
        reject(evt)
      }

      const elementList = this.draw.getOriginalMainElementList()

      if (!Array.isArray(elementList)) {
        console.error('elementList is not an array:', elementList)
        return
      }
      this.wordCountWorker.postMessage(elementList)
    })
  }

  public getCatalog(): Promise<ICatalog | null> {
    return new Promise((resolve, reject) => {
      this.catalogWorker.onmessage = evt => {
        resolve(evt.data)
      }

      this.catalogWorker.onerror = evt => {
        reject(evt)
      }

      const elementList = this.draw.getOriginalMainElementList()

      if (!Array.isArray(elementList)) {
        console.error('elementList is not an array:', elementList)
        return
      }
      this.catalogWorker.postMessage(elementList)
    })
  }

  public getGroupIds(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.groupWorker.onmessage = evt => {
        resolve(evt.data)
      }

      this.groupWorker.onerror = evt => {
        reject(evt)
      }

      const elementList = this.draw.getOriginalMainElementList()

      if (!Array.isArray(elementList)) {
        console.error('elementList is not an array:', elementList)
        return
      }
      this.groupWorker.postMessage(elementList)
    })
  }
}
