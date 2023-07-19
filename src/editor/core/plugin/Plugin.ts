import Editor from '../..'
import { PluginFunction } from '../../interface/Plugin'

export class Plugin {
  private editor: Editor

  constructor(editor: Editor) {
    this.editor = editor
  }

  public use<Options>(
    pluginFunction: PluginFunction<Options>,
    options?: Options
  ) {
    pluginFunction(this.editor, options)
  }
}
