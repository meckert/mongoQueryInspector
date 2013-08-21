var mongodb = require('mongodb'),
	Db = require('mongodb').Db;

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

function extractQueryKeysFromQuery(query, keys) {
	for (var key in query) {
		if (key !== '$explain') {

			if (typeof query[key] === "object" && (query[key] instanceof RegExp === false)) {
				extractQueryKeysFromQuery(query[key], keys);
			} else {
				if (keys.indexOf(key) === -1) {
					keys.push(key);
				}
			}
		}
	}

	return keys;
}

// TODO: rename function
function findAllSystemProfileQueries(client, callback) {
	var systemProfile = new mongodb.Collection(client, 'system.profile');

	systemProfile.find({op: "query", "ns" : {$not : /system/}}).toArray(function(err, results) {
		if (err) {
			throw err;
		}

		//TODO: rename queries
		var queries = [];

		for (var result in results) {
			var collection = results[result].ns.replace(client.databaseName + '.', '');
			var query = results[result].query;

			for (var key in query) {
				if (key !== '$query' && key !== '$explain') {
					var extractedKeys = extractQueryKeysFromQuery(query, []);
					queries.push({ "collection" : collection, "query" : query, "queryKeys" : extractedKeys });
				}
			}
		}

		callback(queries);
	});
}

function callExplainOnQueries(client, queries, callback) {
	for (var query in queries) {

		var collection = new mongodb.Collection(client, queries[query].collection);
		var fullQuery = client.databaseName + '.' + queries[query].collection + '.find(' + JSON.stringify(queries[query].query) + ')';
		var queryKeys = queries[query].queryKeys;

		(function(query, collection, fullQuery, queryKeys) {
			collection.find(query).explain(function(err, explaination) {
				callback({ 'query' : fullQuery, 'explaination' : explaination, 'queryKeys' : queryKeys });
			});
		})(queries[query].query, collection, fullQuery, queryKeys);
	}
}

exports.connect = connect;
exports.findAllSystemProfileQueries = findAllSystemProfileQueries;
exports.callExplainOnQueries = callExplainOnQueries;
