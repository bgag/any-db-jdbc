'use strict';

var
  EventEmitter = require('events').EventEmitter,
  jdbc = require('jdbc'),
  util = require('util');

/**
 * JDBC Query for event handling
 * @constructor
 */
var JdbcQuery = function () {
  EventEmitter.call(this);
};

util.inherits(JdbcQuery, EventEmitter);


/**
 * JDBC Connection
 * @param config
 * @constructor
 */
var JdbcConnection = function (config) {
  var
    self = this,
    connection = new jdbc();

  // inject parameters into SQL string
  var unparameterize = function (sql, parameters) {
    var wrapValue = function (value, wrap, escape) {
      if (value === null) {
        return value;
      }

      if (typeof value === 'number') {
        return value;
      }

      //TODO: handle escape
      return wrap + value + wrap;
    };

    parameters.forEach(function (value, index) {
      sql = sql.replace('$' + (index+1), wrapValue(value, '\'', '\\'));
    });

    return sql;
  };

  /**
   * Open connection
   * @param callback
   */
  this.open = function (callback) {
    if (callback == null) {
      callback = function () {};
    }

    connection.initialize(config, function (error) {
      if (error != null) {
        callback(error);
      } else {
        connection.open(function (error) {
          if (error != null) {
            callback(error);
          } else {
            callback(null, self);
          }
        });
      }
    });
  };

  /**
   * Execute SELECT query
   * @param sql
   * @param callback
   * @returns {JdbcQuery}
   */
  this.executeQuery = function (sql, callback) {
    var query;

    if (callback == null) {
      callback = function () {};
    }

    query = new JdbcQuery();

    connection.executeQuery(sql, function (error, rows) {
      if (Array.isArray(rows)) {
        rows.forEach(function (row) {
          query.emit('row', row);
        });
      }

      callback(error, {rows: rows});
    });

    return query;
  };

  /**
   * Execute UPDATE, INSERT, etc. query
   * @param sql
   * @param callback
   * @returns {JdbcQuery}
   */
  this.executeUpdate = function (sql, callback) {
    var query;

    if (callback == null) {
      callback = function () {};
    }

    query = new JdbcQuery();

    connection.executeUpdate(sql, function (error, result) {
      if (Array.isArray(result)) {
        result.forEach(function (row) {
          query.emit('row', row);
        });
      }

      callback(error, result);
    });

    return query;
  };

  /**
   * Execute any query (detects type of query)
   * @param sql
   * @returns {JdbcQuery}
   */
  this.query = function (sql) {
    var
      parameters = arguments.length === 3 ? arguments[1] : null,
      callback = arguments.length > 1 ? arguments[arguments.length-1] : null;

    if (parameters != null) {
      sql = unparameterize(sql, parameters);
    }

    if (sql.trim().substr(0, 6).toLowerCase().indexOf('select') === 0) {
      return this.executeQuery(sql, callback);
    } else {
      return this.executeUpdate(sql, callback);
    }
  };

  /**
   * Close connection
   * @param callback
   */
  this.end = function (callback) {
    if (callback == null) {
      callback = function () {};
    }

    connection.close(callback);
  };
};


/**
 * JDBC Adapter
 */
var adapter = { name: 'jdbc', configs: {}, Connection: JdbcConnection };

adapter.url2Id = function (url) {
  if (typeof url === 'object') {
    url = url.adapter + url.host + url.database;
  }

  return url
    .replace(/\:/g, '')
    .replace(/\//g, '');
};

adapter.registerConfig = function (config) {
  if ('uri' in config) {
    config.url = config.uri;
  }

  adapter.configs[adapter.url2Id(config.url)] = config;
};

adapter.createConnection = function (opts, callback) {
  var
    connection,
    id = adapter.url2Id(opts);

  if (callback == null) {
    callback = function () {};
  }

  if (!(id in adapter.configs)) {
    callback('unknown config');

    return null;
  }

  connection = new JdbcConnection(adapter.configs[id]);

  connection.open(callback);

  return connection;
};


module.exports = adapter;