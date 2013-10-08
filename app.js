var data = require('./data.js'),
	inspector = require('./inspector.js'),
	log = require('./logger.js'),
	cfg = require('./config.js'),
	async = require('async');

// TODO:

// - write more tests/fix tests
// - update readme file
// - better logging
// - logging for teamcity

var dbs = cfg.mongo.dbs;
var finishedWork = false;

var queue = async.queue(function(task, callback) {
	task(function(result) {
		return callback(result);
	});
}, 1);

// using queue to makes sure that db connections are closed after all async work is done.
queue.drain = function() {
	setInterval(function() {
		if (finishedWork) {
			console.log('processing finished');
			data.closeAllDbConnections();
			clearInterval(this);
		}
	}, 1000);
}

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
				finishedWork = false;

				data.getCollectionDocumentsCount(client, explainResult.collection, countResult);

				function countResult(documentCount) {
					if (inspector.queryPerformedFullTableScan(explainResult, documentCount)) {
						data.getIndexesForCollection(client, explainResult.collection, function(indexes) {
							var missingIndexes = inspector.getMissingIndexes(indexes, explainResult.queryKeys);
							var logEntry = { 'collectionName' : explainResult.collection, 'query' : explainResult.query, 'missingIndexes' : missingIndexes };

							log.toFile(logEntry);
							finishedWork = true;
						});	
					}

					finishedWork = true;
				}
			}
		}
	}
}