var config = {};

config.log = {};
config.log.path = 'c:\\temp';
config.log.fileName = 'mongoQueryInspector.log';

config.mongo = {};
config.mongo.uri = '127.0.0.1';
config.mongo.port = '27017';
config.mongo.credentials =  [
								{dbName : 'blog', username: 'blog', password: 'qwer'},
								{dbName : 'enron', username: 'enron', password: 'qwer'},
							]

module.exports = config;