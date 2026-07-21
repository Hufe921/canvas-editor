import Editor from '../../editor'
import createExportDocx, {
  CommandWithExportDocx,
  IExportDocxOption
} from './exportDocx'


export type CommandWithDocx = CommandWithExportDocx

export type { IExportDocxOption }

export default function docxPlugin(editor: Editor) {
  const command = editor.command as CommandWithDocx
  command.executeExportDocx = createExportDocx(editor.command)
}
