import { EditorZone } from '../../dataset/enum/Editor'
import { Draw } from '../draw/Draw'

export class Zone {

  private draw: Draw
  private currentZone: EditorZone

  constructor(draw: Draw) {
    this.draw = draw
    this.currentZone = EditorZone.MAIN
  }

  public isHeaderActive(): boolean {
    return this.getZone() === EditorZone.HEADER
  }

  public isMainActive(): boolean {
    return this.getZone() === EditorZone.MAIN
  }

  public getZone(): EditorZone {
    return this.currentZone
  }

  public setZone(payload: EditorZone) {
    if (this.currentZone === payload) return
    this.currentZone = payload
    this.draw.getRange().clearRange()
    this.draw.render({
      isSubmitHistory: false,
      isSetCursor: false,
      isCompute: false
    })
  }

}