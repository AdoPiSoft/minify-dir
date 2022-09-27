//removeIf(debug)
console.log('debug code')
//endRemoveIf(debug)

// removeIf(prod)
console.log('prod code')
// endRemoveIf(prod)

if (process.env.NODE_ENV == 'production') {
  console.log('test minify')
}
