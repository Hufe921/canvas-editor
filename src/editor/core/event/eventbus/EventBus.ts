export class EventBus<EventMap> {
  private eventHub: Map<string, Set<Function>>

  constructor() {
    this.eventHub = new Map()
  }

  public on<K extends string & keyof EventMap>(
    eventName: K,
    callback: EventMap[K]
  ) {
    if (!eventName || typeof callback !== 'function') return
    const eventSet = this.eventHub.get(eventName) || new Set()
    eventSet.add(callback)
    this.eventHub.set(eventName, eventSet)
  }

  public emit<K extends string & keyof EventMap>(
    eventName: K,
    payload?: EventMap[K] extends (payload: infer P) => void ? P : never
  ) {
    if (!eventName) return
    const callBackSet = this.eventHub.get(eventName)
    if (!callBackSet) return
    if (callBackSet.size === 1) {
      const callBack = [...callBackSet]
      return callBack[0](payload)
    }
    callBackSet.forEach(callBack => callBack(payload))
  }

  public off<K extends string & keyof EventMap>(
    eventName: K,
    callback: EventMap[K]
  ) {
    if (!eventName || typeof callback !== 'function') return
    const callBackSet = this.eventHub.get(eventName)
    if (!callBackSet) return
    callBackSet.delete(callback)
  }

  public isSubscribe<K extends string & keyof EventMap>(eventName: K): boolean {
    const eventSet = this.eventHub.get(eventName)
    return !!eventSet && eventSet.size > 0
  }

  public dangerouslyClearAll() {
    this.eventHub.clear()
  }
}
