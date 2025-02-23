import {
  IContentChange,
  IControlChange,
  IIntersectionPageNoChange,
  IPageModeChange,
  IPageScaleChange,
  IPageSizeChange,
  IRangeStyleChange,
  ISaved,
  IVisiblePageNoListChange,
  IZoneChange
} from '../../interface/Listener'

export class Listener {
  public rangeStyleChange: IRangeStyleChange | null
  public visiblePageNoListChange: IVisiblePageNoListChange | null
  public intersectionPageNoChange: IIntersectionPageNoChange | null
  public pageSizeChange: IPageSizeChange | null
  public pageScaleChange: IPageScaleChange | null
  public saved: ISaved | null
  public contentChange: IContentChange | null
  public controlChange: IControlChange | null
  public pageModeChange: IPageModeChange | null
  public zoneChange: IZoneChange | null

  constructor() {
    this.rangeStyleChange = null
    this.visiblePageNoListChange = null
    this.intersectionPageNoChange = null
    this.pageSizeChange = null
    this.pageScaleChange = null
    this.saved = null
    this.contentChange = null
    this.controlChange = null
    this.pageModeChange = null
    this.zoneChange = null
  }
}
