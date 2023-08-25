import { IElement } from '../../../interface/Element'

enum ElementType {
  TABLE = 'table'
}

function getGroupIds(elementList: IElement[]): string[] {
  const groupIds: string[] = []
  for (const element of elementList) {
    if (element.type === ElementType.TABLE) {
      const trList = element.trList!
      for (let r = 0; r < trList.length; r++) {
        const tr = trList[r]
        for (let d = 0; d < tr.tdList.length; d++) {
          const td = tr.tdList[d]
          groupIds.push(...getGroupIds(td.value))
        }
      }
    }
    if (!element.groupIds) continue
    for (const groupId of element.groupIds) {
      if (!groupIds.includes(groupId)) {
        groupIds.push(groupId)
      }
    }
  }
  return groupIds
}

onmessage = evt => {
  const elementList = <IElement[]>evt.data
  const groupIds = getGroupIds(elementList)
  postMessage(groupIds)
}
