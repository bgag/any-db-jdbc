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
  libpath: path.join(__dirname, '../drivers/fmjdbc.jar'),
  drivername: 'com.filemaker.jdbc.Driver',
  url: 'jdbc:filemaker://localhost/test',
  user: 'Admin'
};


describe('filemaker', function () {
  var
    connection;

  this.timeout(10000);

  before(function (done) {
    // prepare database
    fs.unlinkSync(path.join(__dirname, './support/test.fmp12'));
    fs.writeFileSync(
      path.join(__dirname, './support/test.fmp12'),
      fs.readFileSync(path.join(__dirname, './support/test.org.fmp12'))
    );

    // start FileMaker
    spawn('osascript', ['test/support/start-filemaker.as']);

    // wait...
    setTimeout(done, 9000);
  });

  after(function (done ) {
    // stop FileMaker
    spawn('osascript', ['test/support/stop-filemaker.as']);

    // wait...
    setTimeout(done, 5000);
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