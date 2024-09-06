import { EventBusMap } from '../../interface/EventBus'
import { Draw } from '../draw/Draw'
import { EventBus } from '../event/eventbus/EventBus'
import { positionContextChange } from './handlers/positionContextChange'

export class Actuator {
  private draw: Draw
  private eventBus: EventBus<EventBusMap>

  constructor(draw: Draw) {
    this.draw = draw
    this.eventBus = draw.getEventBus()
    this.execute()
  }

  private execute() {
    this.eventBus.on('positionContextChange', payload => {
      positionContextChange(this.draw, payload)
    })
  }
}
