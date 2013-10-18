var data = require('./data.js'),
	inspector = require('./inspector.js'),
	log = require('./logger.js'),
	cfg = require('./config.json'),
	async = require('async'),
    program = require('commander');


program
    .option('-u, --uri [full uri]', 'eg. mongodb://user:passwd@host:port/database')
    .parse(process.argv);

var dbs = program.uri ? [program.uri] : cfg.databases;

if (dbs.length === 0) {
	console.log("No Database specified in config.js! Add at least one Database to config.databases array.");
	return;
}

var queue = async.queue(function(task, callback) {
	task(function(result) {
		return callback(result);
	});
}, 1);

log.logInfo('processing started');
for (var i=0; i < dbs.length; i++) {
    data.connect(dbs[i], connected);

    function close(db) {
        log.logInfo('processing finished for: ' + db.databaseName);
        db.close();
    }

	function connected(client) {
		data.findAllSystemProfileQueryEntries(client, foundSystemProfileQueryEntries);

		function foundSystemProfileQueryEntries(queryEntries) {
            if (!queryEntries || queryEntries.length === 0) {
                return close(client);
            }

			var parsedQueries = inspector.parseQueryEntries(queryEntries);
			
			data.callExplainOnQueries(client, parsedQueries, queue, finishedExplain);

			function finishedExplain(explainResult) {
				if (inspector.queryPerformedFullTableScan(explainResult)) {
					data.getIndexesForCollection(client, explainResult.collection, function(indexes) {
						var missingIndexes = inspector.getMissingIndexes(indexes, explainResult.queryFields);
						var logEntry = { 'collectionName' : explainResult.collection, 'query' : explainResult.query, 'missingIndexes' : missingIndexes };

						log.logError(logEntry);
					});
				} else {
                    return close(client);
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