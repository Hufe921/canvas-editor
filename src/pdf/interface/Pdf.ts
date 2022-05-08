import { IEditorOption } from '../../editor'
import { DeepRequired } from '../../editor/interface/Common'

export interface IPdfOption {
  version: string;
  editorOptions: DeepRequired<IEditorOption>;
}