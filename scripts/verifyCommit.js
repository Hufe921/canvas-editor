// @ts-check
import { readFileSync } from 'fs'
import path from 'path'

const msgPath = path.resolve('.git/COMMIT_EDITMSG')
const msg = readFileSync(msgPath, 'utf-8').trim()

const commitRE =
  /^(revert: )?(feat|fix|docs|dx|style|refactor|perf|test|workflow|build|ci|chore|types|wip|release|improve)(\(.+\))?: .{1,50}/

if (!commitRE.test(msg)) {
  console.error(
    `invalid commit message format.\n\n` +
    `    Proper commit message format is required for automated changelog generation. Examples:\n\n` +
    `    feat: add page header\n` +
    `    fix: IME position error #155\n`
  )
  process.exit(1)
}