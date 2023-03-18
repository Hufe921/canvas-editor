import { EditorZone } from '../../dataset/enum/Editor'

export class Zone {

  private currentZone: EditorZone

  constructor() {
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
    this.currentZone = payload
  }

}