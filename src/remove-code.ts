import escapeStringRegexp = require('escape-string-regexp')
import path = require('path')
import fs = require('fs')

interface Options {
  commentStart: string
  commentEnd: string
  commentTypes: string[]
  conditions: any
}

interface OptionalOpts {
  commentStart?: string
  commentEnd?: string
  commentTypes?: string[]
  conditions?: any
}

const { extname } = path
const regexCache = new Map()
const extensions = new Map([
  ['.coffee', [['#', ''], ['###', '###']]],
  ['.css', [['/*', '*/']]],
  ['.html', [['<!--', '-->']]],
  ['.cshtml', [['@*', '*@'], ['<!--', '-->']]],
  ['.jade', [['//-', '']]],
  ['.js', [['//', ''], ['/*', '*/']]],
  ['.ts', [['//', ''], ['/*', '*/']]],
  ['.jsx', [['//', ''], ['/*', '*/']]],
  ['.tsx', [['//', ''], ['/*', '*/']]]
])

function applyReplacements (contents: any, { commentTypes, conditions }: Options): any {
  if (contents.length > 0) {
    for (const [key, value] of conditions) {
      for (const [commentStart, commentEnd] of commentTypes) {
        const regex = getRemovalTagsRegExp(commentStart, commentEnd, key)

        contents = contents.replace(regex, function (ignore, original, capture) {
          const not = (capture === '!') ? 1 : 0
          const valXorNot = value ^ not
          return (valXorNot) === 1 ? '' : original
        })
      }
    }
  }
  return contents
}

function getRemovalTagsRegExp (commentStart: string, commentEnd: string, key: string): RegExp {
  const cacheKey = `${commentStart}${commentEnd}${key}`

  if (regexCache.has(cacheKey)) {
    return regexCache.get(cacheKey)
  }

  const escapedCommentStart = escapeStringRegexp(commentStart)
  const escapedKey = escapeStringRegexp(key)
  const escapedCommentEnd = escapeStringRegexp(commentEnd)
  const pattern = [
    '(',
    escapedCommentStart,
    '\\s*removeIf\\((!?)',
    escapedKey,
    '\\)\\s*',
    escapedCommentEnd,
    '\\s*' +
    '(\\n|\\r|.)*?',
    escapedCommentStart,
    '\\s*endRemoveIf\\((!?)',
    escapedKey,
    '\\)\\s*',
    escapedCommentEnd,
    ')'
  ].join('')

  const re = new RegExp(pattern, 'gi')

  regexCache.set(cacheKey, re)

  return re
}

function removeCode (contents, options: Options): string {
  return applyReplacements(contents, options)
}

function prepareOptions (filePath: string, options: any): Options {
  if (filePath !== '') {
    if (options.commentStart !== '') {
      // Detect comment tokens
      const fileExt = extname(filePath)
      options.commentTypes = extensions.has(fileExt) ? extensions.get(fileExt) : [['//', '']]
    } else {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      options.commentTypes = [[options.commentStart, options.commentEnd || '']]
    }
  }

  return options
}

export = async function (file: string, options: OptionalOpts): Promise<string> {
  options = Object.assign({}, options)
  options.conditions = []

  for (const condition of Object.entries(options)) {
    if (condition[0] !== 'commentStart' && condition[0] !== 'commentEnd') {
      options.conditions.push(condition)
    }
  }

  const opts = prepareOptions(file, options)
  const contents = await fs.promises.readFile(file, 'utf8')
  const result = removeCode(contents, opts)

  return result
}
