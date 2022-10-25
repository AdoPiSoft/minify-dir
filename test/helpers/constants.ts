import path = require('node:path')

const cwd = process.cwd()

export = {
  PWD: cwd,
  BASE_DIR: path.join(cwd, 'test/sample-files'),
  RELEASE_DIR: path.join(cwd, 'release')
}
