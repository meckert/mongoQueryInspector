var mongodb = require('mongodb'),
	Db = require('mongodb').Db;

function _extractQueryKeysFromQuery(query, keys) {
	function isValueTypeOfObject(key, query) {
		if (typeof query[key] === "object" && 
			(query[key] instanceof RegExp === false)) {
				return true;
		}

		return false;
	}

	function isValueOperator(key, query) {
		if (Object.keys(query[key]).toString().indexOf("$") > -1) {
			return true;
		}

		return false;
	}

	function isValueObjectId(key, query) {
		if (Object.keys(query[key]).toString().indexOf("_bsontype") > -1) {
			return true;
		}

		return false;
	}

	for (var key in query) {
		if (key !== '$explain') {			
			if (isValueTypeOfObject(key, query) && !isValueOperator(key, query) && !isValueObjectId(key, query)) {
				_extractQueryKeysFromQuery(query[key], keys);
			} else {
				if (keys.indexOf(key) === -1) {
					keys.push(key);
				}
			}
		}
	}

	return keys;
}

function connect(hostName, port, dbName, username, password, callback) {
	var server = new mongodb.Server(hostName, port);
	var db = new Db(dbName, server, {safe: true});

	db.open(function(err, client) {
		if (err) {
			throw err;
		}

		db.authenticate(username, password, function(err, result) {
			console.log('connected to mongodb: ' + client.databaseName);
			callback(client);
		});
	});
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

		callback(indexes);
	}
}

function getMissingIndexes(indexes, queryKeys) {
	var missingIndexes = [];

	queryKeys.forEach(function(key) {
		if (indexes.indexOf(key) === -1 && missingIndexes.indexOf(key) === -1) {
			missingIndexes.push(key);
		}
	});

	return missingIndexes;
}

function findAllSystemProfileQueryEntries(client, callback) {
	var systemProfile = new mongodb.Collection(client, 'system.profile');

	systemProfile.find({op: "query", "ns" : {$not : /system/}}).toArray(foundSystemProfileQueryEntries);

	function foundSystemProfileQueryEntries(err, allQueryEntries) {
		if (err) { throw err; }

		var queryEntries = [];

		for (var entry in allQueryEntries) {
			var collection = allQueryEntries[entry].ns.replace(client.databaseName + '.', '');
			var query = allQueryEntries[entry].query;

			for (var key in query) {
				if (key !== '$query' && key !== '$explain') {
					queryEntries.push({ "collection" : collection, "query" : query });
				}
			}
		}

		callback(queryEntries);
	}
}

function callExplainOnQueries(client, queries, callback) {
	for (var query in queries) {

		var collection = new mongodb.Collection(client, queries[query].collection);
		var fullQuery = client.databaseName + '.' + queries[query].collection + '.find(' + JSON.stringify(queries[query].query) + ')';

		var extractedKeys = _extractQueryKeysFromQuery(queries[query].query, []);

		(function(query, collection, fullQuery, extractedKeys) {
			collection.find(query).explain(function(err, explaination) {
				callback({ 'collection' : collection.collectionName, 'query' : fullQuery, 'explaination' : explaination, 'queryKeys' : extractedKeys });
			});
		})(queries[query].query, collection, fullQuery, extractedKeys);
	}
}


exports.connect = connect;
exports.findAllSystemProfileQueryEntries = findAllSystemProfileQueryEntries;
exports.callExplainOnQueries = callExplainOnQueries;
exports.getIndexesForCollection = getIndexesForCollection;
exports.getMissingIndexes = getMissingIndexes;