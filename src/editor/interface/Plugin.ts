import Editor from '..'

export type PluginFunction<Options> = (editor: Editor, options?: Options) => void

export type UsePlugin = <Options>(
  pluginFunction: PluginFunction<Options>,
  options?: Options
) => void
