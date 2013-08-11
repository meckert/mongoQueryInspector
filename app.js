var data = require('./data.js'),
	log = require('./logger.js'),
	cfg = require('./config.js');

// TODO:

// - enable profiling on startup / set system.profile capped collection limit to 500
// - add index suggestion to log results
// - Do we need an index for the system.profile queries?
// - write tests
// - integrate socket.io
// - Implement web UI

var credentials = cfg.mongo.credentials;

for (var i=0; i < credentials.length; i++) {
	var dbName = credentials[i].dbName || '';
	var username = credentials[i].username || '';
	var password = credentials[i].password || '';

	data.connect(cfg.mongo.uri, cfg.mongo.port, dbName, username, password, function(client) {
		var watchQueries = function () {
			data.findAllSystemProfileQueries(client, function(queries) {
				data.callExplainOnQueries(client, queries, function(explainResult) {
					if (explainResult && explainResult.explaination && explainResult.explaination.cursor === 'BasicCursor') {
						log.logToFile(cfg.log.path, cfg.log.fileName, explainResult.query);
					}
				});
			});
			setTimeout(watchQueries, cfg.logInterval);
		}
		watchQueries();
	});
}