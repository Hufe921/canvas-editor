import ts from 'typescript'
import { defineConfig } from 'vite'
import typescript from '@rollup/plugin-typescript'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { fileURLToPath } from 'node:url'

export default defineConfig(({ mode }) => {
  const name = 'canvas-editor'
  const resolve = {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@tests': fileURLToPath(new URL('./tests', import.meta.url)),
      '@cspell-en-us-dictionary': `${fileURLToPath(
        new URL(
          './node_modules/@cspell/dict-en_us/en_US.trie.gz',
          import.meta.url
        )
      )}?url`
    }
  }
  const test = {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    css: false,
    pool: 'threads',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/editor/**'],
      exclude: [
        'src/editor/interface/**',
        'src/editor/dataset/constant/**',
        'src/editor/dataset/enum/**',
        'src/editor/core/draw/particle/latex/utils/symbols.ts',
        'src/editor/core/draw/particle/latex/utils/hershey.ts'
      ]
    }
  }
  if (mode === 'lib') {
    return {
      resolve,
      test,
      plugins: [
        cssInjectedByJsPlugin({
          attributes: { id: `${name}-style` },
          topExecutionPriority: true
        }),
        typescript({
          tsconfig: './tsconfig.json',
          include: ['./src/editor/**/*.ts', './src/vite-env.d.ts'],
          transformers: {
            afterDeclarations: [
              context => source =>
                ts.visitEachChild(
                  source,
                  node => {
                    // CSS is injected into JS; declarations must not import a
                    // nonexistent stylesheet in a standalone consumer.
                    if (
                      ts.isImportDeclaration(node) &&
                      ts.isStringLiteral(node.moduleSpecifier) &&
                      node.moduleSpecifier.text.endsWith('.css')
                    )
                      return undefined
                    return node
                  },
                  context
                )
            ]
          }
        })
      ],
      build: {
        emptyOutDir: true,
        lib: {
          name,
          fileName: name,
          formats: ['es'],
          entry: fileURLToPath(
            new URL('./src/editor/index.ts', import.meta.url)
          )
        },
        sourcemap: true
      }
    }
  }
  return {
    resolve,
    test,
    base: `/${name}/`,
    server: {
      host: '0.0.0.0',
      port: 3000
    }
  }
})
