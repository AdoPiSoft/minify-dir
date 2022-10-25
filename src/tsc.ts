import ts = require('typescript')

export = (source: string, options: ts.CompilerOptions): string => {
  const result = ts.transpileModule(source, { compilerOptions: options })
  return result.outputText
}
