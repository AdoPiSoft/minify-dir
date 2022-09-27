import path from 'path'
import minify_src from './index.mjs'

const basePath = 'tests'
const dest = path.join(process.cwd(), 'release/@adopisoft')
const excludeDirs = ['tests/exclude']
const removeCode = {
  debug: true
}


minify_src('src', { basePath, dest, excludeDirs, removeCode })
