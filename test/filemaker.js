/* global after, before, cp, describe, exec, ln, it, rm, test */

'use strict'

require('shelljs/global')

var anyDb = require('any-db')
var anyDbJdbc = require('..')
var assert = require('assert')
var fs = require('fs')
var path = require('path')

var config = {
  libpath: 'drivers/fmjdbc.jar',
  drivername: 'com.filemaker.jdbc.Driver',
  uri: 'jdbc:filemaker://localhost/test',
  user: 'Admin',
  password: ''
}

describe('filemaker', function () {
  this.timeout(11000)

  before(function (done) {
    // create link so any-db can access the driver
    if (!test('-L', 'node_modules/any-db-jdbc')) {
      ln('-s', '..', 'node_modules/any-db-jdbc')
    }

    // prepare database
    rm('test/support/test.fmp12')
    cp('test/support/test.org.fmp12', 'test/support/test.fmp12')

    // start FileMaker ...
    var startFilemakerAs = 'tell application "Finder"\n' +
      '  open POSIX file "' + path.join(__dirname, 'support/test.fmp12') + '"\n' +
      '  delay 5\n' +
      'end tell\n'

    if (test('-f', 'test/support/start-filemaker.as')) {
      rm('test/support/start-filemaker.as')
    }

    fs.writeFileSync('test/support/start-filemaker.as', startFilemakerAs)
    exec('osascript test/support/start-filemaker.as')

    done()
  })

  after(function (done) {
    setTimeout(function () {
      // stop FileMaker ...
      exec('osascript test/support/stop-filemaker.as')

      done()
    }, 1000)
  })

  it('should register a configuration', function () {
    anyDbJdbc.registerConfig(config)

    assert.equal(Object.keys(anyDbJdbc.configs).length, 1)
  })

  it('should establish a connection', function (done) {
    var connection = anyDb.createConnection(config.url, function (err) {
      assert.equal(err, null)

      connection.end(function () {
        done()
      })
    })
  })

  it('should close a connection', function (done) {
    var connection = anyDb.createConnection(config.url, function () {
      connection.end(function (err) {
        assert.equal(err, null)

        done()
      })
    })
  })

  it('should run a update query', function (done) {
    var connection = anyDb.createConnection(config.url, function () {
      connection.query('INSERT INTO test VALUES (1, \'test\')', function (err) {
        assert.equal(err, null)

        connection.end(function () {
          done()
        })
      })
    })
  })

  it('should run a select query', function (done) {
    var connection = anyDb.createConnection(config.url, function () {
      connection.query('INSERT INTO test VALUES (2, \'test 2\')', function () {
        connection.query('SELECT * FROM test WHERE ID=2', function (err, result) {
          assert.equal(err, null)
          assert.deepEqual(result, {rows: [{ID: 2, TEXT: 'test 2'}]})

          connection.end(function () {
            done()
          })
        })
      })
    })
  })

  it('should support events for select query', function (done) {
    var connection = anyDb.createConnection(config.url, function () {
      connection.query('INSERT INTO test VALUES (3, \'test 3\')', function () {
        connection.query('SELECT * FROM test WHERE ID=3').on('row', function (row) {
          assert.deepEqual(row, {ID: 3, TEXT: 'test 3'})

          connection.end(function () {
            done()
          })
        })
      })
    })
  })

  it('should run a parameterized integer select query', function (done) {
    var connection = anyDb.createConnection(config.url, function () {
      connection.query('INSERT INTO test VALUES (4, \'test 4\')', function () {
        connection.query('SELECT * FROM test WHERE ID = ?', [4], function (err, result) {
          assert.equal(err, null)
          assert.deepEqual(result, {rows: [{ID: 4, TEXT: 'test 4'}]})

          connection.end(function () {
            done()
          })
        })
      })
    })
  })

  it('should run a parameterized string select query', function (done) {
    var connection = anyDb.createConnection(config.url, function () {
      connection.query('INSERT INTO test VALUES (5, \'test 5\')', function () {
        connection.query('SELECT * FROM test WHERE TEXT = ?', ['test 5'], function (err, result) {
          assert.equal(err, null)
          assert.deepEqual(result, {rows: [{ID: 5, TEXT: 'test 5'}]})

          connection.end(function () {
            done()
          })
        })
      })
    })
  })
})
