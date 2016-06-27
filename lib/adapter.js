var Connection = require('./connection')

var adapter = {
  name: 'jdbc',
  configs: {},
  Connection: Connection
}

adapter.url2Id = function (url) {
  if (typeof url === 'object') {
    url = url.adapter + url.host + url.database
  }

  return url.replace(/:/g, '').replace(/\//g, '')
}

adapter.registerConfig = function (config) {
  if (config.uri) {
    config.url = config.uri
  }

  adapter.configs[adapter.url2Id(config.url)] = config
}

adapter.createConnection = function (options, callback) {
  var id = adapter.url2Id(options)

  if (!(id in adapter.configs)) {
    if (callback) {
      callback(new Error('unknown config'))
    }

    return null
  }

  var connection = new Connection(adapter.configs[id])

  connection.open(callback)

  return connection
}

module.exports = adapter
