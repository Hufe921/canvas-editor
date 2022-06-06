import { IElement } from '../../../interface/Element'

onmessage = (evt) => {
  const elementList = <IElement[]>evt.data
  // TODO:
  postMessage(elementList.length)
}
