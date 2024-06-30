import { EventBusMap } from '../../interface/EventBus'
import { Draw } from '../draw/Draw'
import { EventBus } from '../event/eventbus/EventBus'

export class MouseObserver {
  private draw: Draw
  private eventBus: EventBus<EventBusMap>
  private pageContainer: HTMLDivElement
  constructor(draw: Draw) {
    this.draw = draw
    this.eventBus = this.draw.getEventBus()
    this.pageContainer = this.draw.getPageContainer()
    this.pageContainer.addEventListener('mousemove', this._mousemove.bind(this))
    this.pageContainer.addEventListener(
      'mouseenter',
      this._mouseenter.bind(this)
    )
    this.pageContainer.addEventListener(
      'mouseleave',
      this._mouseleave.bind(this)
    )
  }

  private _mousemove(evt: MouseEvent) {
    if (!this.eventBus.isSubscribe('mousemove')) return
    this.eventBus.emit('mousemove', evt)
  }

  private _mouseenter(evt: MouseEvent) {
    if (!this.eventBus.isSubscribe('mouseenter')) return
    this.eventBus.emit('mouseenter', evt)
  }

  private _mouseleave(evt: MouseEvent) {
    if (!this.eventBus.isSubscribe('mouseleave')) return
    this.eventBus.emit('mouseleave', evt)
  }
}
