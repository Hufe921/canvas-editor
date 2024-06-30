import {
  IContentChange,
  IControlChange,
  IIntersectionPageNoChange,
  IMouseEventChange,
  IPageModeChange,
  IPageScaleChange,
  IPageSizeChange,
  IRangeStyleChange,
  ISaved,
  IVisiblePageNoListChange,
  IZoneChange
} from './Listener'

export interface EventBusMap {
  rangeStyleChange: IRangeStyleChange
  visiblePageNoListChange: IVisiblePageNoListChange
  intersectionPageNoChange: IIntersectionPageNoChange
  pageSizeChange: IPageSizeChange
  pageScaleChange: IPageScaleChange
  saved: ISaved
  contentChange: IContentChange
  controlChange: IControlChange
  pageModeChange: IPageModeChange
  zoneChange: IZoneChange
  mousemove: IMouseEventChange
  mouseleave: IMouseEventChange
  mouseenter: IMouseEventChange
}
