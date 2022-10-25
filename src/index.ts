import fs = require('fs')
import path = require('path')
import removeDebug = require('./remove-code')
import tsCompile = require('./tsc')
import ts = require('typescript')
import Uglify = require('uglify-js')

interface Options {
  minify: boolean | Uglify.MinifyOptions
  copy: boolean
  tsc: ts.BuildOptions
  dest: string
  basePath: string
  excludePatterns: RegExp[]
  removeCode: any
}

interface OptionalOpts {
  minify?: boolean | Uglify.MinifyOptions
  copy?: boolean
  tsc?: ts.BuildOptions
  dest?: string
  basePath?: string
  excludePatterns?: RegExp[]
  removeCode?: any
}

const dirsCache: string[] = []

const defaultOpts: Options = {
  minify: true,
  copy: true,
  tsc: {
    module: 'commonjs'
  },
  dest: process.cwd(),
  basePath: process.cwd(),
  excludePatterns: [/\.git/],
  removeCode: {}
}

async function createDir (dir: string): Promise<void> {
  if (!dirsCache.includes(dir)) {
    await fs.promises.mkdir(dir, { recursive: true })
    dirsCache.push(dir)
  }
}

function normalizeOptions (opt: OptionalOpts): Options {
  const options: Options = Object.assign(defaultOpts, opt)
  let { minify, copy, tsc, basePath, dest, excludePatterns, removeCode } = options

  if (typeof copy !== 'boolean') {
    copy = defaultOpts.copy
  }

  if (typeof tsc !== 'object') {
    tsc = defaultOpts.tsc
  }

  if (typeof excludePatterns === 'string') {
    excludePatterns = [excludePatterns]
  }
  if (!basePath.startsWith('/')) {
    basePath = path.join(process.cwd(), basePath)
  }
  if (!dest.startsWith('/')) {
    dest = path.join(basePath, dest)
  }
  return { minify, copy, tsc, basePath, dest, excludePatterns, removeCode }
}

export = async function minifyDir (dir: string, opts: OptionalOpts) {
  const options: Options = normalizeOptions(opts)
  const { minify, basePath, dest, removeCode, excludePatterns, copy, tsc } = options

  async function readdir (dirPath: string): Promise<string[]> {
    const files = await fs.promises.readdir(dirPath).then(files => {
      return files.map(f => path.join(dirPath, f))
    })
    return files
  }

  async function readdirRecursive (dirPath: string, filePaths: string[] = []): Promise<string[]> {
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

  function normalizePath (f: string, cwd: string = basePath): string {
    f = f.replace(cwd, '')
    if (f.startsWith('/')) { f = f.substring(1) }
    return f
  }

  function performMinify (code: string): string {
    const minifyOpts = typeof minify === 'object' ? minify : {}
    const result = Uglify.minify(code, minifyOpts)
    if (result.error != null) throw new Error(String(result.error))
    return result.code
  }

  const dirPath = path.join(basePath, dir)
  const files = await readdirRecursive(dirPath)

  await Promise.all(files.map(async f => {
    const fileReg = /\.(js|ts)$/
    const dstFile = path.join(dest, normalizePath(f)).replace(/\.ts$/, '.js')
    const dstDir = path.dirname(path.join(dest, normalizePath(f)))
    const excluded = excludePatterns.filter(reg => reg.test(f)).length > 0

    if (!excluded) {
      if (fileReg.test(f)) {
        const str = await removeDebug(f, removeCode)
        const code = f.endsWith('.ts') ? tsCompile(str, tsc) : str
        const shouldMinify = minify !== false && typeof minify !== 'undefined'
        const result = shouldMinify ? performMinify(code) : code
        await createDir(dstDir)
        await fs.promises.writeFile(dstFile, result)
        if (shouldMinify) {
          console.log(`Minified: ${normalizePath(f)} -> ${path.join(normalizePath(dest, process.cwd()), normalizePath(dstFile, dest))}`)
        } else {
          console.log(`Removed debug codes: ${normalizePath(f)} -> ${path.join(normalizePath(dest, process.cwd()), normalizePath(dstFile, dest))}`)
        }
      } else if (copy) {
        await createDir(dstDir)
        await fs.promises.cp(f, dstFile)
        console.log(`Copied: ${normalizePath(f)} -> ${path.join(normalizePath(dest, process.cwd()), normalizePath(dstFile, dest))}`)
      } else {
        console.log(`Skipping: ${normalizePath(f)}`)
      }
    } else {
      console.log(`Excluded: ${normalizePath(f)}`)
    }
  }))
}
