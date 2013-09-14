var data = require('./data.js'),
	log = require('./logger.js'),
	cfg = require('./config.js');

// TODO:

// - write tests / fix tests

var credentials = cfg.mongo.credentials;

for (var i=0; i < credentials.length; i++) {
	var dbName = credentials[i].dbName || '';
	var username = credentials[i].username || '';
	var password = credentials[i].password || '';

	data.connect(cfg.mongo.uri, cfg.mongo.port, dbName, username, password, connected);

	function connected(client) {
		data.findAllSystemProfileQueryEntries(client, foundSystemProfileQueryEntries);

		function foundSystemProfileQueryEntries(queryEntries) {

			var parsedQueries = data.parseQueryEntries(queryEntries);

			data.callExplainOnQueries(client, parsedQueries, finishedExplain);

			function finishedExplain(explainResult) {
				if (explainResult && explainResult.explaination) {

					explainResult.explaination.allPlans.forEach(function(plan) {
						if (plan.cursor === 'BasicCursor') {
							data.getIndexesForCollection(client, explainResult.collection, function(indexes) {
								var missingIndexes = data.getMissingIndexes(indexes, explainResult.queryKeys);
								var logEntry = { 'collectionName' : explainResult.collection, 'query' : explainResult.query, 'missingIndexes' : missingIndexes };

								log.toFile(logEntry);
							});	
						}
					});						
				}
			}
		}
	}
}