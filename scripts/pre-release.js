import fs from 'fs'
import path from 'path'

const pkgPath = path.resolve('package.json')

// 校验包合法性
fs.accessSync(path.resolve('dist'), fs.constants.F_OK)
fs.accessSync(path.resolve('dist/canvas-editor.js'), fs.constants.F_OK)
fs.accessSync(path.resolve('dist/src/editor/index.d.ts'), fs.constants.F_OK)
if (fs.readdirSync('dist').some(file => /umd|\.cjs$/.test(file))) {
  throw new Error('Remove stale UMD/CommonJS output before publishing')
}

// 缓存项目package.json
const sourcePkg = fs.readFileSync(pkgPath, 'utf-8')

// 删除无用属性
const targetPkg = JSON.parse(sourcePkg)
Reflect.deleteProperty(targetPkg, 'engines')
Reflect.deleteProperty(targetPkg.scripts, 'postinstall')
fs.writeFileSync(pkgPath, JSON.stringify(targetPkg, null, 2))
