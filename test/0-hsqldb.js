/* global __dirname, after, before, describe */

'use strict';


var
  anyDb = require('any-db'),
  anyDbJdbc = require('any-db-jdbc'),
  assert = require('assert'),
  fs = require('fs'),
  path = require('path'),
  spawn = require('child_process').spawn;


var config = {
  libpath: path.join(__dirname, '../drivers/hsqldb.jar'),
  drivername: 'org.hsqldb.jdbc.JDBCDriver',
  url: 'jdbc:hsqldb:hsql://localhost/xdb'
};


describe('hsqldb', function () {
  var
    server,
    connection;

  before(function (done) {
    server = spawn('java', ['-cp', 'drivers/hsqldb.jar', 'org.hsqldb.server.Server', '--database.0', 'file:mydb', '--dbname.0', 'xdb']);

    setTimeout(done, 1000);
  });

  after(function () {
    server.kill();

    fs.rmdirSync('mydb.tmp');
    fs.unlinkSync('mydb.log');
    fs.unlinkSync('mydb.properties');
    fs.unlinkSync('mydb.script');
  });

  it('should register a configuration', function () {
    anyDbJdbc.registerConfig(config);
  });

  it('should establish a connection', function (done) {
    connection = anyDb.createConnection(config.url, function (error) {
      assert.equal(error, null);

      done();
    });
  });

  it('should create a table', function (done) {
    connection.query('CREATE TABLE test(ID INTEGER, TEXT VARCHAR(255));', function (error) {
      assert.equal(error, null);

      done();
    });
  });

  it('should insert a row', function (done) {
    connection.query('INSERT INTO test VALUES (1, \'test\')', function (error) {
      assert.equal(error, null);

      done();
    });
  });

  it('should select inserted row', function (done) {
    connection.query('SELECT * FROM test', function (error, result) {
      assert.deepEqual(result, {rows: [{ID: 1, TEXT: 'test'}] });

      done();
    });
  });

  it('should update row', function (done) {
    connection.query('UPDATE test SET TEXT = \'abc\' WHERE ID = 1', function (error) {
      assert.equal(error, null);

      done();
    });
  });

  it('should select updated row', function (done) {
    connection.query('SELECT * FROM test', function (error, result) {
      assert.deepEqual(result, {rows: [{ID: 1, TEXT: 'abc'}] });

      done();
    });
  });

  it('should support event based select', function (done) {
    connection.query('SELECT * FROM test').on('row', function (row) {
      assert.deepEqual(row, {ID: 1, TEXT: 'abc'});

      done();
    });
  });

  it('should support parameterized integer select', function (done) {
    connection.query('SELECT * FROM test WHERE ID = $1', [1], function (error, result) {
      assert.deepEqual(result, {rows: [{ID: 1, TEXT: 'abc'}] });

      done();
    });
  });

  it('should support parameterized string select', function (done) {
    connection.query('SELECT * FROM test WHERE TEXT = $1', ['abc'], function (error, result) {
      assert.deepEqual(result, {rows: [{ID: 1, TEXT: 'abc'}] });

      done();
    });
  });

  it('should close connection', function (done) {
    connection.end(function (error) {
      assert.equal(error, null);

      done();
    });
  });
});