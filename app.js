var data = require('./data.js'),
	inspector = require('./inspector.js'),
	log = require('./logger.js'),
	cfg = require('./config.js'),
	async = require('async');

// TODO:

// - add white/blacklist
// - write more tests/fix tests
// - rename keys ot fields
// - update readme file
// - better logging
// - logging for teamcity
// - "distinct" queries ASAP
// - NPM module

var dbs = cfg.mongo.dbs;

var queue = async.queue(function(task, callback) {
	task(function(result) {
		return callback(result);
	});
}, 1);

// using queue to makes sure that db connections are closed after all async work is done.

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
				data.getCollectionDocumentsCount(client, explainResult.collection, countResult);

				function countResult(documentCount) {
					if (inspector.queryPerformedFullTableScan(explainResult, documentCount)) {
						data.getIndexesForCollection(client, explainResult.collection, function(indexes) {
							var missingIndexes = inspector.getMissingIndexes(indexes, explainResult.queryKeys);
							var logEntry = { 'collectionName' : explainResult.collection, 'query' : explainResult.query, 'missingIndexes' : missingIndexes };

							log.toFile(logEntry);
						});	
					}
				}
			}
		}
	}
}

queue.drain = function() {
	console.log('processing finished');
	data.closeAllDbConnections();
	clearInterval(this);
}