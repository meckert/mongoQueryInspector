var config = {};

config.log = {};
config.log.path = 'c:\\temp';
config.log.fileName = 'mongoQueryInspector.log';
config.log.useTeamCityLog = false;

config.mongo = {};
config.mongo.uri = 'localhost';
config.mongo.port = '27017';
config.mongo.dbs =  [
						{ dbName : 'test', username: 'test', password: 'test' }
					];

module.exports = config;