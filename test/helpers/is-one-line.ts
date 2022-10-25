import fs = require('node:fs/promises')

export = async (file: string): Promise<boolean> => {
  const content = await fs.readFile(file, 'utf8')
  const strArr = content.split('\n')
  return strArr.length < 2
}
