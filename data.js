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

function findAllSystemProfileQueries(client, callback) {
	var systemProfile = new mongodb.Collection(client, 'system.profile');

	systemProfile.find({op: "query", "ns" : {$not : /system/}}).toArray(function(err, results) {
		if (err) {
			throw err;
		}

		var queries = [];

		for (var result in results) {
			var collection = results[result].ns.replace(client.databaseName + '.', '');
			var query = results[result].query;

			for (var key in query) {
				if (key !== '$query' && key !== '$explain') {
					queries.push({ "collection" : collection, "query" : query });	
				}
			}
		}

		callback(queries);
	});
}

function callExplainOnQueries(client, queries, callback) {
	// workaround since JSON.stringify does not work with regex.
	// e.g. JSON.stringify({a: /5/}) --> "{}"
	
	// TODO: needs refactoring!!!
	function jsonToString(json) {
		var str = "{";

		for (var key in json) {
			if (key === 'query' || key === 'orderby') { // TODO: make this more generic. Should work for everything else as well.
				for (var key2 in json[key]) {
					str += key + ' : {' + key2 + ' : ' + json[key][key2] + '},';	
				}
			} else {
			    str += key + ' : ' + json[key] + ',';	
			}
		}

		return str.substring(0, str.length - 1) + "}";
	}

	for (var query in queries) {

		var collection = new mongodb.Collection(client, queries[query].collection);
		var fullQuery = client.databaseName + '.' + queries[query].collection + '.find(' + jsonToString(queries[query].query) + ')';

		(function(query, collection, fullQuery) {
			collection.find(query).explain(function(err, explaination) {
				callback({ 'query' : fullQuery, 'explaination' : explaination });
			});
		})(queries[query].query, collection, fullQuery);
	}
}

exports.connect = connect;
exports.findAllSystemProfileQueries = findAllSystemProfileQueries;
exports.callExplainOnQueries = callExplainOnQueries;