import { DocumentProperties } from 'jspdf'
import { IEditorOption } from '../../editor'
import { DeepRequired } from '../../editor/interface/Common'

export interface IPdfOption {
  editorVersion: string;
  editorOptions: DeepRequired<IEditorOption>;
  documentProperties?: DocumentProperties;
}