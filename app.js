var data = require('./data.js'),
	log = require('./logger.js'),
	cfg = require('./config.js');

// TODO:

// - enable profiling on startup / set system.profile capped collection limit to 500
// - Do we need an index for the system.profile queries?
// - write tests
// - integrate socket.io

var credentials = cfg.mongo.credentials;

for (var i=0; i < credentials.length; i++) {
	var dbName = credentials[i].dbName || '';
	var username = credentials[i].username || '';
	var password = credentials[i].password || '';

	data.connect(cfg.mongo.uri, cfg.mongo.port, dbName, username, password, function(client) {
		var watchQueries = function () {
			data.findAllSystemProfileQueries(client, function(queries) {
				data.callExplainOnQueries(client, queries, function(explainResult) {
					if (explainResult && explainResult.explaination && explainResult.explaination.cursor === 'BasicCursor') { // move to a rules.js file, where different loggin roles can be defined
						log.logToFile(cfg.log.path, cfg.log.fileName, 'Query without index detected: ' + explainResult.query);
					}
				});
			});

			setTimeout(watchQueries, cfg.log.Interval);
		}
		watchQueries();
	});
}