# any-db-jdbc

A any-db JDBC adapter.

## Usage

See the [any-db documentation](https://www.npmjs.com/package/any-db) how to use any-db.
The JDBC adapter requires an additional driver register step to load the JDBC driver.

### Example

This example connects to a HSQLDB on localhost with user `user` and password `password`.

    var anyDB = require('any-db')
    var anyDBJDBC = require('any-db-jdbc')

    var config = {
      libpath: 'drivers/hsqldb.jar',
      drivername: 'org.hsqldb.jdbc.JDBCDriver',
      uri: 'jdbc:hsqldb:hsql://localhost/xdb',
      user: 'user',
      password: 'password'
    }

    // register the JDBC driver
    anyDBJDBC.registerConfig(config)

    var connection = anyDb.createConnection(config.uri, function (err) {
      // ...

     connection.end(function (err) {})
    })
