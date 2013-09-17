var data = require('./data.js'),
	log = require('./logger.js'),
	cfg = require('./config.js'),
	async = require('async');

var credentials = cfg.mongo.credentials;
var finishedLogging = false;

var q = async.queue(function(task, callback) {
	task(function(result) {
		callback(result);
	});
}, 1);

q.drain = function() {
	setInterval(function() {
		if (finishedLogging) {
			console.log('processing finished');
			data.closeAllDbConnections();
			clearInterval(this);
		}
	}, 1000);
}


function queryPerformedFullTableScan(explainResult, documentCount) {
	if (explainResult.explaination.cursor === 'BasicCursor' || explainResult.explaination.nscannedObjects === documentCount) {
		return true;
	}

	return false;
}

for (var i=0; i < credentials.length; i++) {
	var dbName = credentials[i].dbName || '';
	var username = credentials[i].username || '';
	var password = credentials[i].password || '';

	data.connect(cfg.mongo.uri, cfg.mongo.port, dbName, username, password, connected);

	function connected(client) {
		data.findAllSystemProfileQueryEntries(client, foundSystemProfileQueryEntries);

		function foundSystemProfileQueryEntries(queryEntries) {
			var parsedQueries = data.parseQueryEntries(queryEntries);
			
			data.callExplainOnQueries(client, parsedQueries, q, finishedExplain);

			function finishedExplain(explainResult) {
				finishedLogging = false;

				data.getCollectionDocumentsCount(client, explainResult.collection, countResult);

				function countResult(documentCount) {

					if (queryPerformedFullTableScan(explainResult, documentCount)) {
						data.getIndexesForCollection(client, explainResult.collection, function(indexes) {
							var missingIndexes = data.getMissingIndexes(indexes, explainResult.queryKeys);
							var logEntry = { 'collectionName' : explainResult.collection, 'query' : explainResult.query, 'missingIndexes' : missingIndexes };

							log.toFile(logEntry);
							finishedLogging = true;
						});	
					}
				}
			}
		}
	}
}