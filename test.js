const path = require('path')
const fs = require('fs')
const minifyDir = require('./index.js')

const minify = {
  mangle: {
    reserved: [
      'require',
      'exports',
      'process'
    ]
  },
  compress: true
}
const copy = true
const basePath = '.'
const dest = path.join(process.cwd(), 'release/@adopisoft')
const excludeDirs = [
  'tests/exclude',
  'tests/src/.git'
]
const removeCode = {
  debug: true,
  prod: true
}

async function test() {
  await minifyDir('tests', { minify, copy, basePath, dest, excludeDirs, removeCode })
  const result = await fs.promises.readFile('release/@adopisoft/tests/src/remove_if_test.js', 'utf8')
  console.log('RESULT:\n', result)
}

test()
