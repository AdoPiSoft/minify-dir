const path = require('path')
const fs = require('fs')
const minify_dir = require('./index.js')

const minify = false
const basePath = 'tests'
const dest = path.join(process.cwd(), 'release/@adopisoft')
const excludeDirs = ['tests/exclude']
const removeCode = {
  debug: false,
  prod: true
}


async function test() {
  await minify_dir('src', { minify, basePath, dest, excludeDirs, removeCode })
  const result = await fs.promises.readFile('release/@adopisoft/src/remove_if_test.js', 'utf8')
  console.log('RESULT:\n\n\n', result)
}

test()
