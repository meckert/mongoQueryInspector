function parseQueryEntries(queryEntries) {
	var parsedQueryEntries = [];

	for (var queryEntry in queryEntries) {
		var parsedQueryEntry = {};
		var query = queryEntries[queryEntry].query;

		for (var key in query) {
			if (key === "$explain") {
				continue;
			}
			
			if (key === "query" || key === "$query") {
				parsedQueryEntry["query"] = query[key];
				continue;
			}

			if (key === "orderby" || key === "$orderby") {				
				parsedQueryEntry["sort"] = query[key];
				parsedQueryEntries.push({ "collection" : queryEntries[queryEntry].collection, "query" : parsedQueryEntry});
				continue;
			}

			parsedQueryEntries.push({ "collection" : queryEntries[queryEntry].collection, "query" : query });
		}
	}

	return parsedQueryEntries;
}

function extractQueryKeysFromQuery(query, keys) {
	function isValueTypeOfObject(key, query) {
		if (typeof query[key] === "object" && 
			(query[key] instanceof RegExp === false)) {
				return true;
		}

		return false;
	}

	function isValueOperator(key, query) {
		if (query[key] !== null && Object.keys(query[key]).toString().indexOf("$") > -1) {
			return true;
		}

		return false;
	}

	function isValueTypeOfObjectId(key, query) {
		if (query[key] !== null && Object.keys(query[key]).toString().indexOf("_bsontype") > -1) {
			return true;
		}

		return false;
	}

	for (var key in query) {
		if (key !== '$explain') {			
			if (isValueTypeOfObject(key, query) && !isValueOperator(key, query) && !isValueTypeOfObjectId(key, query)) {
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

function getMissingIndexes(indexes, queryKeys) {
	var missingIndexes = [];

	queryKeys.forEach(function(key) {
		if (indexes.indexOf(key) === -1 && missingIndexes.indexOf(key) === -1) {
			missingIndexes.push(key);
		}
	});

	return missingIndexes;
}

function queryPerformedFullTableScan(explainResult, documentCount) {
	if (explainResult.explaination.cursor === 'BasicCursor' || explainResult.explaination.nscanned === documentCount) {
		return true;
	}

	return false;
}

exports.parseQueryEntries = parseQueryEntries;
exports.getMissingIndexes = getMissingIndexes;
exports.queryPerformedFullTableScan = queryPerformedFullTableScan;
exports.extractQueryKeysFromQuery = extractQueryKeysFromQuery;