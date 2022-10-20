// removeIf(debug)
console.log('debug code')
// endRemoveIf(debug)

// removeIf(prod)
console.log('prod code')
// endRemoveIf(prod)

if (process.env.NODE_ENV === 'production') {
  const toMangle = 1
  if (toMangle > 0) {
    console.log('a is > 0')
  }
}
