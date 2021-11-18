export interface IRangeStype {
  undo: boolean;
  redo: boolean;
  format: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeout: boolean;
  color: string | null;
  highlight: string | null;
}

export type IRangeStyleChange = (payload: IRangeStype) => void;
