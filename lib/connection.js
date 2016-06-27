var jinst = require('jdbc/lib/jinst')
var driverManager = require('jdbc/lib/drivermanager')
var JDBC = require('jdbc')
var Query = require('./query')

function dummyCallback () {}

function Connection (config) {
  this.config = config

  var classpath = Array.isArray(this.config.libpath) ? this.config.libpath : [this.config.libpath]

  if (!jinst.isJvmCreated()) {
    jinst.addOption('-Xrs')
    jinst.setupClasspath(classpath)
  }

  this.config.properties = this.config.properties || {}

  if (this.config.user) {
    this.config.properties.user = this.config.user
  }

  if (this.config.password) {
    this.config.properties.password = this.config.password
  }

  this.pool = new JDBC(this.config)
}

Connection.prototype.open = function (callback) {
  callback = callback || dummyCallback

  var self = this

  this.pool.initialize(function (err) {
    if (err) {
      return callback(err)
    }

    driverManager.getConnection(self.config.url, self.config.user, self.config.password, function (err, connection) {
      if (err) {
        return callback(err)
      }

      self.connection = connection

      callback(null, self)
    })
  })
}

Connection.prototype.query = function (sql) {
  var parameters = arguments.length === 3 ? arguments[1] : null
  var callback = arguments.length > 1 ? arguments[arguments.length - 1] : dummyCallback

  var query = new Query(this.connection, sql, parameters, callback)

  if (sql.trim().substr(0, 6).toLowerCase().indexOf('select') === 0) {
    return query.query()
  } else {
    return query.update()
  }
}

Connection.prototype.end = function (callback) {
  callback = callback || dummyCallback

  this.pool.release(this.connection, callback)
}

module.exports = Connection
