import { defineConfig, UserConfig } from 'vite'
import * as path from 'path'

export default defineConfig(({ mode }) => {
  const name = 'canvas-editor-demo'
  const defaultOptions: UserConfig = {
    base: `/${name}/`
  }
  if (mode === 'lib') {
    return {
      ...defaultOptions,
      build: {
        lib: {
          name,
          fileName: (format) => `${name}.${format}.js`,
          entry: path.resolve(__dirname, 'src/editor/index.ts')
        }
      }
    }
  }
  return {
    ...defaultOptions
  }
})