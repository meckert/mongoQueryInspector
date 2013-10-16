var config = {};

config.log = {};
config.log.path = 'c:\\temp';
config.log.fileName = 'mongoQueryInspector.log';

config.mongo = {};
config.mongo.uri = '127.0.0.1';
config.mongo.port = '27017';
config.mongo.dbs =  [
						//{ dbName : 'test', username: 'test', password: 'test' }
					]

module.exports = config;