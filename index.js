const fs = require('fs')
const path = require('path')
const removeDebug = require('./remove_debug.js')
const babelMinify = require('babel-minify')

const dirsCache = []

const defaultOpts = {
  minify: true,
  copy: true,
  dest: process.cwd(),
  basePath: process.cwd(),
  excludeDirs: [],
  removeCode: {}
}

async function createDir(dir) {
  if (dirsCache.indexOf(dir) < 0) {
    await fs.promises.mkdir(dir, { recursive: true })
    dirsCache.push(dir)
  }
}

function normalizeOptions(options) {
  options ||= {}
  options = Object.assign(defaultOpts, options)
  let { minify, copy, basePath, dest, excludeDirs, removeCode } = options

  if (typeof excludeDirs === 'string') {
    excludeDirs = [excludeDirs]
  }
  if (!basePath.startsWith('/')) {
    basePath = path.join(process.cwd(), basePath)
  }
  if (!dest.startsWith('/')) {
    dest = path.join(basePath, dest)
  }

  excludeDirs = Array.isArray(excludeDirs)
    ? excludeDirs
    : []

  excludeDirs = excludeDirs.map(ed => {
    if (!ed.startsWith('/')) {
      return path.join(basePath, ed)
    }
    return ed
  })

  return { minify, copy, basePath, dest, excludeDirs, removeCode }
}

module.exports = async function minifyDir(dir, options) {
  options = normalizeOptions(options)
  const { minify, basePath, dest, removeCode, excludeDirs, copy } = options

  async function readdir(dirPath) {
    const files = await fs.promises.readdir(dirPath).then(files => {
      return files.map(f => path.join(dirPath, f))
        .filter(f => {
          return !excludeDirs.filter(d => f.startsWith(d)).length
        })
    })
    return files
  }

  async function readdirRecursive(dirPath, filePaths) {
    filePaths ||= []
    const files = await readdir(dirPath)

    await Promise.all(files.map(async f => {
      const stat = await fs.promises.lstat(f)
      if (stat.isFile()) {
        filePaths.push(f)
      }
      if (stat.isDirectory()) {
        await readdirRecursive(f, filePaths)
      }
    }))

    return filePaths
  }

  function normalizePath(f, cwd) {
    cwd ||= basePath
    f = f.replace(cwd, '')
    if (f.startsWith('/')) { f = f.substring(1) }
    return f
  }

  function performMinify(code) {
    try {
      const minifyOpts = typeof minify === 'object' ? minify : {}
      return babelMinify(code, minifyOpts)
    } catch (e) {
      // return original code
      console.error(e)
      return code
    }
  }

  const dirPath = path.join(basePath, dir)
  const files = await readdirRecursive(dirPath)

  await Promise.all(files.map(async f => {
    const shouldMinify = f.endsWith('.js') && minify
    const dstFile = path.join(dest, normalizePath(f))
    const dstDir = path.dirname(path.join(dest, normalizePath(f)))

    if (shouldMinify) {
      const str = await removeDebug(f, removeCode)
      const { code } = shouldMinify ? performMinify(str) : { code: str }

      await createDir(dstDir)
      await fs.promises.writeFile(dstFile, code)
      try {
        console.log(`Minified: ${normalizePath(f)} -> ${path.join(normalizePath(dest, process.cwd()), normalizePath(dstFile, dest))}`)
      } catch (e) {
        console.log(`Removed codes: ${normalizePath(f)}`)
      }
    } else if (copy) {
      await createDir(dstDir)
      await fs.promises.cp(f, dstFile)
      console.log(`Copied: ${normalizePath(f)} -> ${path.join(normalizePath(dest, process.cwd()), normalizePath(dstFile, dest))}`)
    } else {
      console.log(`Skipping: ${normalizePath(f)}`)
    }
  }))
}
