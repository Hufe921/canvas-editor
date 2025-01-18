import { defineConfig } from 'vite'
import typescript from '@rollup/plugin-typescript'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import * as path from 'path'
import { resolve } from 'node:url'

export default defineConfig(({ mode }) => {
  const name = 'canvas-editor'
  if (mode === 'lib') {
    return {
      plugins: [
        cssInjectedByJsPlugin({
          styleId: `${name}-style`,
          topExecutionPriority: true
        }),
        {
          ...typescript({
            tsconfig: './tsconfig.json',
            include: ['./src/editor/**']
          }),
          apply: 'build',
          declaration: true,
          declarationDir: 'types/',
          rootDir: '/'
        }
      ],
      build: {
        lib: {
          name,
          fileName: name,
          entry: path.resolve(__dirname, 'src/editor/index.ts')
        },
        rollupOptions: {
          output: {
            sourcemap: true
          }
        }
      }
    }
  }
  return {
    base: `/${name}/`,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        pdf: resolve(__dirname, 'pdf.html'),
      }
    },
    server: {
      host: '0.0.0.0'
    }
  }
})
