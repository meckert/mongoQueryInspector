var data = require('./data.js'),
	inspector = require('./inspector.js'),
	log = require('./logger.js'),
	cfg = require('./config.js'),
	async = require('async');

// TODO:

// - "distinct" queries ASAP

var dbs = cfg.mongo.dbs;

if (dbs.length === 0) {
	console.log("No Database specified in config.js! Add at least one Database to config.mongo.dbs array.");
	return;
}

var queue = async.queue(function(task, callback) {
	task(function(result) {
		return callback(result);
	});
}, 1);

for (var i=0; i < dbs.length; i++) {
	var dbName = dbs[i].dbName || '';
	var username = dbs[i].username || '';
	var password = dbs[i].password || '';

	data.connect(cfg.mongo.uri, cfg.mongo.port, dbName, username, password, connected);

	function connected(client) {
		data.findAllSystemProfileQueryEntries(client, foundSystemProfileQueryEntries);

		function foundSystemProfileQueryEntries(queryEntries) {
			var parsedQueries = inspector.parseQueryEntries(queryEntries);
			
			data.callExplainOnQueries(client, parsedQueries, queue, finishedExplain);

			function finishedExplain(explainResult) {
				if (inspector.queryPerformedFullTableScan(explainResult)) {
					data.getIndexesForCollection(client, explainResult.collection, function(indexes) {
						var missingIndexes = inspector.getMissingIndexes(indexes, explainResult.queryFields);
						var logEntry = { 'collectionName' : explainResult.collection, 'query' : explainResult.query, 'missingIndexes' : missingIndexes };

						log.logError(logEntry);
					});	
				}
			}
		}
	}
}

// using queue to make sure that db connections are closed after all async work is done.
queue.drain = function() {
	log.logInfo('processing finished')
	data.closeAllDbConnections();
}