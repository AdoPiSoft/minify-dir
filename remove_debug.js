const escapeStringRegexp = require('escape-string-regexp')
const { extname } = require('path')
const fs = require('fs')

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

function applyReplacements (contents, {commentTypes, conditions}) {
  if (contents.length > 0) {
    for (const [key, value] of conditions) {
      for (const [commentStart, commentEnd] of commentTypes) {
        const regex = getRemovalTagsRegExp(commentStart, commentEnd, key)

        contents = contents.replace(regex, function (ignore, original, capture) {
          const not = (capture === '!')
          return (value ^ not) ? '' : original
        })
      }
    }
  }
  return contents
}

function getRemovalTagsRegExp (commentStart, commentEnd, key) {
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

function removeCode (contents, options) {
  try {
    return applyReplacements(contents, options)
  } catch (error) {
    console.log(error)
  }
}

function prepareOptions (file_path, options) {
  if (file_path) {
    if (!options.commentStart) {
      // Detect comment tokens
      const fileExt = extname(file_path)
      options.commentTypes = extensions.has(fileExt) ? extensions.get(fileExt) : [['//', '']]
    } else {
      options.commentTypes = [[options.commentStart, options.commentEnd || '']]
    }
  }

  return options
}

module.exports = async function (file, options) {
  options = Object.assign({}, options)
  options.conditions = []

  for (const condition of Object.entries(options)) {
    if (condition[0] !== 'commentStart' && condition[0] !== 'commentEnd') {
      options.conditions.push(condition)
    }
  }

  options = prepareOptions(file, options)
  const contents = await fs.promises.readFile(file, 'utf8')
  const result = removeCode(contents, options)

  return result
}
