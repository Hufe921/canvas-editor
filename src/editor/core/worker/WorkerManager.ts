import { version } from '../../../../package.json'
import { Draw } from '../draw/Draw'
import WordCountWorker from './works/wordCount?worker&inline'
import CatalogWorker from './works/catalog?worker&inline'
import GroupWorker from './works/group?worker&inline'
import ValueWorker from './works/value?worker&inline'
import { ICatalog } from '../../interface/Catalog'
import { IEditorResult } from '../../interface/Editor'
import { IGetValueOption } from '../../interface/Draw'
import { deepClone } from '../../utils'

export class WorkerManager {
  private draw: Draw
  private wordCountWorker: Worker
  private catalogWorker: Worker
  private groupWorker: Worker
  private valueWorker: Worker

  constructor(draw: Draw) {
    this.draw = draw
    this.wordCountWorker = new WordCountWorker()
    this.catalogWorker = new CatalogWorker()
    this.groupWorker = new GroupWorker()
    this.valueWorker = new ValueWorker()
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
      const positionList = this.draw.getPosition().getOriginalMainPositionList()
      this.catalogWorker.postMessage({
        elementList,
        positionList
      })
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
      this.groupWorker.postMessage(elementList)
    })
  }

  public getValue(options?: IGetValueOption): Promise<IEditorResult> {
    return new Promise((resolve, reject) => {
      this.valueWorker.onmessage = evt => {
        resolve({
          version,
          data: evt.data,
          options: deepClone(this.draw.getOptions())
        })
      }

      this.valueWorker.onerror = evt => {
        reject(evt)
      }

      this.valueWorker.postMessage({
        data: this.draw.getOriginValue(options),
        options
      })
    })
  }
}
