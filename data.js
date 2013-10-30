var inspector = require('./inspector.js'),
	log = require('./logger.js'),
	mongodb = require('mongodb'),
	Db = require('mongodb').Db,
	_ = require('lodash'),
	dbConnections = [];

function connect(uri, callback) {
    log.logInfo('connecting to database: ' + uri);

    mongodb.MongoClient.connect(uri, function(err, db) {
        if (err) {
            log.logInfo('Could not connect to database: ' + uri);
            return callback();
        }

        log.logInfo('connected to database: ' + uri);
        dbConnections.push(db);
        callback(db);
    });
}

function closeAllDbConnections() {
	for (var i = 0; i < dbConnections.length; i++) {
		dbConnections[i].close();
	};
}

function getIndexesForCollection(client, collectionName, callback) {
	var collection = new mongodb.Collection(client, collectionName);

	collection.indexInformation(foundIndex);

	function foundIndex(err, indexInfo) {
		if (err) { throw err; }

		var indexes = []

		for (var key in indexInfo) {
			indexes.push(indexInfo[key][0][0]);
		}

		return callback(indexes);
	}
}

function findAllSystemProfileQueryEntries(client, callback) {
	var systemProfile = client.collection('system.profile');

	systemProfile.find({op: "query", "ns" : {$not : /\.system\./}}).toArray(foundSystemProfileQueryEntries);

	function foundSystemProfileQueryEntries(err, allQueryEntries) {
		if (err) { throw err; }

		var queryEntries = [];

		for (var entry in allQueryEntries) {
			var collection = allQueryEntries[entry].ns.replace(client.databaseName + '.', '');
			var query = allQueryEntries[entry].query;

			for (var key in query) {
				var keys = _.keys(query[key]);
				var operator =_.find(keys, function(key) {
					return /^\$size/.test(key);
				});

				if (operator) {
					continue;
				}

				if (key !== '$query' && key !== '$explain') {
					queryEntries.push({ "collection" : collection, "query" : query });
				}
			}
		}

		return callback(queryEntries);
	}
}

function callExplainOnQueries(client, parsedQueries, queue, callback) {
	function createSortOptions(sortEntries) {
		// options format: { "sort" : [['field1', 'asc'], ['field2', 'desc']] }
		var sortFields = [];

		for (var sortField in sortEntries) {
			var innerArray = [];
			innerArray.push(sortField);

			var sortOrderString = sortEntries[sortField] === 1 ? "asc" : "desc";

			innerArray.push(sortOrderString);
			sortFields.push(innerArray);
		}

		return sortFields;
	}

	function addSortFieldsToExtractedFields(sortQuery, extractedFields) {
		var sortFields = Object.keys(sortQuery);
			sortFields.forEach(function(field) {
				extractedFields.push(field);
		});
	}

	for (var parsedQuery in parsedQueries) {

		var collectionName = parsedQueries[parsedQuery].collection;
		var query = parsedQueries[parsedQuery].query.query || parsedQueries[parsedQuery].query;
		var collection = new mongodb.Collection(client, collectionName);
		var fullQuery = client.databaseName + '.' + collectionName + '.find(' + JSON.stringify(query) + ')';

		var extractedFields = inspector.extractFieldsFromQuery(query, []);

		(function(query, collection, fullQuery, extractedFields) {
			var options = {};
			var sortQuery = parsedQueries[parsedQuery].query.sort;

			if (sortQuery) {
				options["sort"] = createSortOptions(sortQuery);
				fullQuery += ".sort(" + JSON.stringify(sortQuery) + ")";
				addSortFieldsToExtractedFields(sortQuery, extractedFields);
			}

			function getExplainResult(fn) {
				collection.find(query, options).explain(function(err, explaination) {
					if (err) throw err;

					fn({ 'collection' : collection.collectionName, 'query' : fullQuery, 'explaination' : explaination, 'queryFields' : extractedFields });
				});
			}

			queue.push(getExplainResult, callback);

		})(query, collection, fullQuery, extractedFields);
	}
}

exports.connect = connect;
exports.closeAllDbConnections = closeAllDbConnections;
exports.findAllSystemProfileQueryEntries = findAllSystemProfileQueryEntries;
exports.callExplainOnQueries = callExplainOnQueries;
exports.getIndexesForCollection = getIndexesForCollection;