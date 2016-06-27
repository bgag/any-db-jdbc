var jinst = require('jdbc/lib/jinst')
var util = require('util')
var EventEmitter = require('events').EventEmitter
var ResultSet = require('jdbc/lib/resultset')

function Query (connection, sql, parameters, callback) {
  EventEmitter.call(this)

  this.connection = connection
  this.text = sql
  this.values = parameters
  this.callback = callback
}

util.inherits(Query, EventEmitter)

Query.prototype.init = function (callback) {
  var self = this

  this.connection.prepareStatement(this.text, function (err, statement) {
    if (err) {
      return callback(err)
    }

    self.statement = statement

    self.setParameters(callback)
  })
}

Query.prototype.setParameters = function (callback) {
  if (!this.values) {
    return callback()
  }

  var self = this

  var next = function (index) {
    if (index >= self.values.length) {
      callback(null, self.statement)
    } else {
      var parameter = self.values[index]

      if (typeof parameter === 'number') {
        self.statement.setInt(index + 1, parameter, next.bind(null, index + 1))
      } else if (typeof parameter === 'string') {
        self.statement.setString(index + 1, parameter, next.bind(null, index + 1))
      } else if (Object.prototype.toString.call(parameter) === '[object Date]') {
        var java = jinst.getInstance()

        var sqlDate = java.newInstanceSync('java.sql.Date', java.newLong(parameter.valueOf()))

        self.statement.setDate(index + 1, sqlDate, null, next.bind(null, index + 1))
      }
    }
  }

  next(0)
}

Query.prototype.handleResult = function (result) {
  var self = this

  if (typeof result === 'object') {
    result = new ResultSet(result)

    result.toObjArray(function (err, rows) {
      if (err) {
        return self.callback(err)
      }

      if (Array.isArray(rows)) {
        rows.forEach(function (row) {
          self.emit('row', row)
        })
      }

      self.callback(null, {rows: rows})
    })
  } else {
    self.callback(null, result)
  }
}

Query.prototype.query = function () {
  var self = this

  this.init(function (err) {
    if (err) {
      return self.callback(err)
    }

    self.statement.executeQuery(function (err, result) {
      if (err) {
        self.callback(err)
      } else {
        self.handleResult(result)
      }
    })
  })

  return this
}

Query.prototype.update = function (sql, parameters, callback) {
  var self = this

  this.init(function (err) {
    if (err) {
      return self.callback(err)
    }

    self.statement.executeUpdate(function (err, result) {
      if (err) {
        self.callback(err)
      } else {
        self.handleResult(result)
      }
    })
  })

  return this
}

module.exports = Query
