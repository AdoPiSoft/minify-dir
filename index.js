const fs = require('fs')
const path = require('path')
const remove_code = require('./remove_debug.js')
const minify = require('babel-minify')

const default_opts = {
  dest: process.cwd(),
  basePath: process.cwd(),
  excludeDirs: [],
  removeCode: {}
}

function normalize_options(options) {
  options ||= {}
  options = Object.assign(default_opts, options)
  let { basePath, dest, excludeDirs, removeCode } = options

  if (typeof excludeDirs == 'string') {
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

  return { basePath, dest, excludeDirs, removeCode }
}

function perform_minify(code) {
  try {
    return minify(code)
  } catch (e) {
    // return original code
    console.log(e)
    return code
  }
}

module.exports = async function minify_dir(dir, options) {
  options = normalize_options(options) 
  const { basePath, dest, removeCode, excludeDirs } = options

  async function readdir (dir_path) {
    const files = await fs.promises.readdir(dir_path).then(files => {
      return files.map(f => path.join(dir_path, f))
        .filter(f => {
          return !excludeDirs.filter(d => f.startsWith(d)).length
        })
    })
    return files
  }

  async function readdir_recursive (dir_path, file_paths) {
    file_paths ||= []
    const files = await readdir(dir_path)

    await Promise.all(files.map(async f => {
      const stat = await fs.promises.lstat(f)
      if (stat.isFile() && /\.(js|json)$/.test(f)) {
        file_paths.push(f)
      }
      if (stat.isDirectory()) {
        await readdir_recursive(f, file_paths)
      }
    }))

    return file_paths
  }

  function normalize_path(f, cwd) {
    cwd ||= basePath
    f = f.replace(cwd, '')
    if (f.startsWith('/')) { f = f.substring(1) }
    return f
  }

  const dir_path = path.join(basePath, dir)
  const files = await readdir_recursive(dir_path)

  await Promise.all(files.map(async f => {
    const str = await remove_code(f, removeCode)
    const { code } = f.endsWith('.js') ? perform_minify(str) : { code: str }
    const dst_file = path.join(dest, normalize_path(f))
    const dst_dir = path.dirname(path.join(dest, normalize_path(f))) 

    await fs.promises.mkdir(dst_dir, {recursive: true})
    await fs.promises.writeFile(dst_file, code)

    try {
      console.log(`Minified: ${normalize_path(f)} -> ${path.join(normalize_path(dest, process.cwd()), normalize_path(dst_file, dest))}`)
    } catch(e) {
      console.log(`Minified: ${normalize_path(f)}`)
    }

  }))
}
