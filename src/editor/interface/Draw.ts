export interface IDrawOption {
  curIndex?: number;
  isSetCursor?: boolean;
  isSubmitHistory?: boolean;
}

export interface IDrawImagePayload {
  width: number;
  height: number;
  value: string;
}

export interface IImageParticleCreateResult {
  resizerSelection: HTMLDivElement;
  resizerHandleList: HTMLDivElement[];
  resizerImageContainer: HTMLDivElement;
  resizerImage: HTMLImageElement;
}