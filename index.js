const fs = require('fs').promises
const path = require('path')
const remove_code = require('./remove_debug.js')
const removeCodeParams = require('@adopisoft/build-params')
const minify = require('babel-minify')
const exclude_dirs = [
  path.join(__dirname, './src/core/test')
]

const remove_code_opts = removeCodeParams()

const strip = f => f.replace(__dirname, '')

const readdir = async (dir_path) => {
  const files = await fs.readdir(dir_path).then(files => {
    return files.map(f => path.join(dir_path, f))
      .filter(f => {
        return !exclude_dirs.filter(d => f.startsWith(d)).length
      })
  })
  return files
}

const readdir_recursive = async (dir_path, file_paths) => {
  file_paths ||= []
  const files = await readdir(dir_path)

  await Promise.all(files.map(async f => {
    const stat = await fs.lstat(f)
    if (stat.isFile() && /\.(js|json)$/.test(f)) {
      file_paths.push(f)
    }
    if (stat.isDirectory()) {
      await readdir_recursive(f, file_paths)
    }
  }))

  return file_paths
}

const perform_minify = code => {
  try {
    return minify(code)
  } catch (e) {
    // return original code
    console.log(e)
    return code
  }
}

const minify_dir = async (dir) => {
  const base_path = path.join(__dirname, 'src')
  const dir_path = path.join(__dirname, 'src', dir)
  const files = await readdir_recursive(dir_path)

  await Promise.all(files.map(async f => {
    const str = await remove_code(f, remove_code_opts)
    const { code } = f.endsWith('.js') ? perform_minify(str) : { code: str }
    const dst_file = f.replace(base_path, path.join(__dirname, 'release/@adopisoft'))
    const dst_dir = path.dirname(dst_file)
    console.log(`Minified: ${strip(f)} -> ${strip(dst_file)}`)
    await fs.mkdir(dst_dir, {recursive: true})
    await fs.writeFile(dst_file, code)
  }))
}

minify_dir(process.argv[2])
