import { Draw } from '../draw/Draw'
import WordCountWorker from './works/wordCount?worker&inline'
import CatalogWorker from './works/catalog?worker&inline'
import { ICatalog } from '../../interface/Catalog'

export class WorkerManager {
  private draw: Draw
  private wordCountWorker: Worker
  private catalogWorker: Worker

  constructor(draw: Draw) {
    this.draw = draw
    this.wordCountWorker = new WordCountWorker()
    this.catalogWorker = new CatalogWorker()
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
      this.catalogWorker.postMessage(elementList)
    })
  }
}
