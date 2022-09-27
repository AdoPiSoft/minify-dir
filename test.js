const path = require('path')
const minify_dir = require('./index.js')

const basePath = 'tests'
const dest = path.join(process.cwd(), 'release/@adopisoft')
const excludeDirs = ['tests/exclude']
const removeCode = {
  debug: true
}


minify_dir('src', { basePath, dest, excludeDirs, removeCode })
