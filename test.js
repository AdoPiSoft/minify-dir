const path = require('path')
const fs = require('fs')
const minifyDir = require('./index.js')

const minify = true
const basePath = 'tests'
const dest = path.join(process.cwd(), 'release/@adopisoft')
const excludeDirs = ['tests/exclude']
const removeCode = {
  debug: false,
  prod: true
}
const copy = true

async function test() {
  await minifyDir('src', { minify, copy, basePath, dest, excludeDirs, removeCode })
  const result = await fs.promises.readFile('release/@adopisoft/src/remove_if_test.js', 'utf8')
  console.log('RESULT:\n\n\n', result)
}

test()
