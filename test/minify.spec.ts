import path = require('node:path')
import chai = require('chai')
import assert = require('assert/strict')
import pq = require('proxyquire')
import isOneLine = require('./helpers/is-one-line')
import constants = require('./helpers/constants')
import minifyDir = require('../')

const proxyquire = pq.noPreserveCache()
const { expect } = chai
const { BASE_DIR, RELEASE_DIR } = constants
const basePath = BASE_DIR
const dest = RELEASE_DIR

const sampleJsPath = path.join(dest, 'src/js-sample.js')
const sampleTsPath = path.join(dest, 'src/ts-sample.js')

describe('Testing minify option', () => {
  describe('When minify = true', () => {
    it('should minify sources', async () => {
      const options = {
        basePath,
        minify: true,
        dest,
        removeCode: {
          debug: false,
          prod: false
        }
      }
      await minifyDir('.', options)
      const sampleJS = proxyquire(sampleJsPath, {})
      const sampleTS = proxyquire(sampleTsPath, {})
      expect(sampleJS()).to.eql({ debug: false, prod: false })
      expect(sampleTS()).to.eql({ debug: false, prod: false })
      assert(await isOneLine(sampleJsPath))
      assert(await isOneLine(sampleTsPath))
    })
    describe('When debug = true', () => {
      it('should remove', async () => {
        const options = {
          basePath,
          minify: true,
          dest,
          removeCode: {
            debug: true,
            prod: false
          }
        }
        await minifyDir('.', options)
        const sampleJS = proxyquire(sampleJsPath, {})
        const sampleTS = proxyquire(sampleTsPath, {})
        expect(sampleJS()).to.eql({ notDebug: false, prod: false })
        expect(sampleTS()).to.eql({ notDebug: false, prod: false })
        assert(await isOneLine(sampleJsPath))
        assert(await isOneLine(sampleTsPath))
      })
    })
  })

  describe('When minify = false', () => {
    it('should not minify sources', async () => {
      const options = {
        basePath,
        minify: false,
        dest,
        removeCode: {
          debug: true,
          prod: false
        }
      }
      await minifyDir('.', options)
      const sampleJS = proxyquire(sampleJsPath, {})
      const sampleTS = proxyquire(sampleTsPath, {})
      expect(sampleJS()).to.eql({ notDebug: false, prod: false })
      expect(sampleTS()).to.eql({ notDebug: false, prod: false })
      assert(!await isOneLine(sampleJsPath))
      assert(!await isOneLine(sampleTsPath))
    })

    describe('When debug = false', () => {
      it('should remove', async () => {
        const options = {
          basePath,
          minify: false,
          dest,
          removeCode: {
            debug: false,
            prod: true
          }
        }
        await minifyDir('.', options)
        const sampleJS = proxyquire(sampleJsPath, {})
        const sampleTS = proxyquire(sampleTsPath, {})
        expect(sampleJS()).to.eql({ debug: false })
        expect(sampleTS()).to.eql({ debug: false })
        assert(!await isOneLine(sampleJsPath))
        assert(!await isOneLine(sampleTsPath))
      })
    })
  })
})
