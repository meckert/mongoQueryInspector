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
			console.log('connected to mongodb: ' + client.databaseName + ' --- host: ' + client.serverConfig.host + ':' + client.serverConfig.port);
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


// TODO: refactor!
function parseQueryEntries(queryEntries) {
	var parsedQueryEntries = [];

	for (var query in queryEntries) {
		var parsedQueryEntry = {};
		for (var key in queryEntries[query].query) {

			if (key === "$explain") {
				continue;
			}
			
			// TODO: bug - query and sort are added multiple times
			if (key === "query" || key === "$query") {
				parsedQueryEntry["query"] = queryEntries[query].query[key];
				continue;
			}

			if (key === "orderby" || key === "$orderby") {
				parsedQueryEntry["sort"] = queryEntries[query].query[key];
				parsedQueryEntries.push({ "collection" : queryEntries[query].collection, "query" : parsedQueryEntry});
				continue;
			}

			parsedQueryEntries.push({ "collection" : queryEntries[query].collection, "query" : queryEntries[query].query });
		}
	}

	return parsedQueryEntries;
}

function callExplainOnQueries(client, parsedQueries, callback) {
	for (var key in parsedQueries) {

		var collectionName = parsedQueries[key].collection;
		var query = parsedQueries[key].query;

		var collection = new mongodb.Collection(client, collectionName);
		var fullQuery = client.databaseName + '.' + collectionName + '.find(' + JSON.stringify(query) + ')';

		var extractedKeys = _extractQueryKeysFromQuery(query, []);

		(function(query, collection, fullQuery, extractedKeys) {

			// TODO: refactor!
			var options = {
			};

			for (var key in query) {
				if (key === "sort") {
					options["sort"] = query[key];
				}
			}

			collection.find(query, options).explain(function(err, explaination) {
				if (err) throw err;

				callback({ 'collection' : collection.collectionName, 'query' : fullQuery, 'explaination' : explaination, 'queryKeys' : extractedKeys });
			});

		})(query, collection, fullQuery, extractedKeys);
	}
}


exports.connect = connect;
exports.findAllSystemProfileQueryEntries = findAllSystemProfileQueryEntries;
exports.callExplainOnQueries = callExplainOnQueries;
exports.getIndexesForCollection = getIndexesForCollection;
exports.getMissingIndexes = getMissingIndexes;
exports.parseQueryEntries = parseQueryEntries;