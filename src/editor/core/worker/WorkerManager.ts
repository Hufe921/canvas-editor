import { Draw } from '../draw/Draw'
import WordCountWorker from './works/wordCount?worker'

export class WorkerManager {

  private draw: Draw
  private wordCountWorker: Worker

  constructor(draw: Draw) {
    this.draw = draw
    this.wordCountWorker = new WordCountWorker()
  }

  public getWordCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.wordCountWorker.onmessage = (evt) => {
        resolve(evt.data)
      }

      this.wordCountWorker.onerror = (evt) => {
        reject(evt)
      }

      const elementList = this.draw.getOriginalElementList()
      this.wordCountWorker.postMessage(elementList)
    })
  }

}