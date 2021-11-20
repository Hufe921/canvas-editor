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