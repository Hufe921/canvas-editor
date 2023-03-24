import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const pkgPath = path.resolve('package.json')

// 缓存项目package.json
const sourcePkg = fs.readFileSync(pkgPath, 'utf-8')

// 删除无用属性
const targetPkg = JSON.parse(sourcePkg)
Reflect.deleteProperty(targetPkg.scripts, 'postinstall')
fs.writeFileSync(pkgPath, JSON.stringify(targetPkg, null, 2))

// 发布包
try {
  execSync('npm publish')
} catch (error) {
  throw new Error(error)
} finally {
  // 还原
  fs.writeFileSync(pkgPath, sourcePkg)
}
