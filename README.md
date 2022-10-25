# minify-dir
Minify typescript/javascript source codes in specified directory with options to remove debug codes.

---

This module was inspired by: https://github.com/crissdev/gulp-remove-code

## Usage

Given a sample JS file `src/dir1/file.js`:
```js
//removeIf(prod)
console.log('This will be removed since options.removeCode.prod is true')
//endRemoveIf(prod)


//removeIf(debug)
console.log('This will not be removed since options.removeCode.debug is false')
//endRemoveIf(debug)
```

```js
import minifyDir from 'minify-dir'
// or const minifyDir = require('minify-dir')

const options = {
  minify: true,
  copy: true,
  tsc: {},
  basePath: '.'
  dest: `${process.cwd()}/release`,
  excludePatterns: [/\.git/],
  removeCode: {
      prod: true,
      debug: false
  }
}

const src = 'src'

minifyDir(src, options)
  .then(() => console.log('Done processing...'))
  .catch(e => console.log('An error ocurred!', e))
```

## Params

- The first param is the directory to be minified. All contents of the `src` directory in this example are going to be processed and the output will be saved in `release` directory. So if you have a file `src/dir1/file.js`, it will be saved in `release/dir1/file.js`.

- The second param is the [**Options**](#Options) object.

## Options

**minify** - If object is passed, the object will be passed on to [uglify-js](https://www.npmjs.com/package/uglify-js). If value is `false`, the output js files are not minified. Default is `true`.

**copy** - Copy none-js files from `src` to `options.dest`. Default `true`

**tsc** - A typescript [compilerOptions](https://www.typescriptlang.org/tsconfig#compilerOptions) object used in transpiling typescript source. Default is `{}`.

**basePath** - The path where to start looking for the `options.src` and where to store the `options.dest` directory. Default is `process.cwd()`.

**dest** - The output folder. Default is `process.cwd() + 'release'`.

**removeCode** - The values passed to remove code conditions. Default is `{}`.

**excludePatterns** - RegExp patterns used to match when excluding files. Excluded files will not be copied nor minified. Default is `[/\.git/]`.
