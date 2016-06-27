/* global after, before, describe, ln, it, test */

'use strict'

require('shelljs/global')

var anyDb = require('any-db')
var anyDbJdbc = require('..')
var assert = require('assert')
var spawn = require('child_process').spawn

var config = {
  libpath: 'drivers/hsqldb.jar',
  drivername: 'org.hsqldb.jdbc.JDBCDriver',
  uri: 'jdbc:hsqldb:hsql://localhost/xdb'
}

describe('hsqldb', function () {
  var server

  before(function (done) {
    // create link so any-db can access the driver
    if (!test('-L', 'node_modules/any-db-jdbc')) {
      ln('-s', '..', 'node_modules/any-db-jdbc')
    }

    // start hsqldb server
    server = spawn('java', ['-cp', 'drivers/hsqldb.jar', 'org.hsqldb.server.Server', '--database.0', 'file:mydb', '--dbname.0', 'xdb'])

    // wait for server to start
    setTimeout(done, 1000)
  })

  after(function () {
    server.kill()
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
      connection.query('DROP TABLE test;', function () {
        connection.query('CREATE TABLE test(ID INTEGER, TEXT VARCHAR(255));', function (err) {
          assert.equal(err, null)

          connection.end(function () {
            done()
          })
        })
      })
    })
  })

  it('should run a select query', function (done) {
    var connection = anyDb.createConnection(config.url, function () {
      connection.query('DROP TABLE test;', function () {
        connection.query('CREATE TABLE test(ID INTEGER, TEXT VARCHAR(255));', function () {
          connection.query('INSERT INTO test VALUES (1, \'test\')', function () {
            connection.query('SELECT * FROM test', function (err, result) {
              assert.equal(err, null)
              assert.deepEqual(result, {rows: [{ID: 1, TEXT: 'test'}]})

              connection.end(function () {
                done()
              })
            })
          })
        })
      })
    })
  })

  it('should support events for select query', function (done) {
    var connection = anyDb.createConnection(config.url, function () {
      connection.query('DROP TABLE test;', function () {
        connection.query('CREATE TABLE test(ID INTEGER, TEXT VARCHAR(255));', function () {
          connection.query('INSERT INTO test VALUES (1, \'test\')', function () {
            connection.query('SELECT * FROM test').on('row', function (row) {
              assert.deepEqual(row, {ID: 1, TEXT: 'test'})

              connection.end(function () {
                done()
              })
            })
          })
        })
      })
    })
  })

  it('should run a parameterized integer select query', function (done) {
    var connection = anyDb.createConnection(config.url, function () {
      connection.query('DROP TABLE test;', function () {
        connection.query('CREATE TABLE test(ID INTEGER, TEXT VARCHAR(255));', function () {
          connection.query('INSERT INTO test VALUES (1, \'test\')', function () {
            connection.query('SELECT * FROM test WHERE ID = ?', [1], function (err, result) {
              assert.equal(err, null)
              assert.deepEqual(result, {rows: [{ID: 1, TEXT: 'test'}]})

              connection.end(function () {
                done()
              })
            })
          })
        })
      })
    })
  })

  it('should run a parameterized string select query', function (done) {
    var connection = anyDb.createConnection(config.url, function () {
      connection.query('DROP TABLE test;', function () {
        connection.query('CREATE TABLE test(ID INTEGER, TEXT VARCHAR(255));', function () {
          connection.query('INSERT INTO test VALUES (1, \'test\')', function () {
            connection.query('SELECT * FROM test WHERE TEXT = ?', ['test'], function (err, result) {
              assert.equal(err, null)
              assert.deepEqual(result, {rows: [{ID: 1, TEXT: 'test'}]})

              connection.end(function () {
                done()
              })
            })
          })
        })
      })
    })
  })

  it('should run a parameterized date select query', function (done) {
    var date = new Date()

    var connection = anyDb.createConnection(config.url, function () {
      connection.query('DROP TABLE test;', function () {
        connection.query('CREATE TABLE test(ID INTEGER, TEXT VARCHAR(255), CREATED DATE);', function () {
          connection.query('INSERT INTO test VALUES (1, \'test\', ?)', [date], function () {
            connection.query('SELECT * FROM test WHERE CREATED = ?', [date], function (err, result) {
              assert.equal(err, null)
              assert.deepEqual(result, {rows: [{ID: 1, TEXT: 'test', CREATED: date.toISOString().slice(0, 10)}]})

              connection.end(function () {
                done()
              })
            })
          })
        })
      })
    })
  })
})
