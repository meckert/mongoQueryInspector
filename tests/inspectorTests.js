var inspector = require('./../inspector.js'),
	expect = require('expect.js');

describe('inspector', function() {

	describe('When extracting keys from queries', function() {

	});

	describe('When getting missing indexes', function() {
		it('should return all missing indexes', function() {
			var indexes = ["index1", "index2"];
			var queryKeys = ["index1"];

			var result = inspector.getMissingIndexes(indexes, queryKeys);
			// expect(result)
		});
	});

	describe('When checking if a query performed full table scan', function() {
		it('should return true if cursor is BasicCursor', function() {
			var explainResult = {
				collection: 'test',
		  		query: 'test',
			  	explaination: { 
			   		cursor: 'BasicCursor',
				    nscannedObjects: 0,
				}
			}

			var result = inspector.queryPerformedFullTableScan(explainResult, 2);
			expect(result).to.be(true);
		});

		it('should return true if number of nscannedObjects is equal to number of documents', function() {
			var explainResult = {
				collection: 'test',
		  		query: 'test',
			  	explaination: { 
			   		cursor: 'BasicCursor',
				    nscannedObjects: 2,
				}
			}

			var result = inspector.queryPerformedFullTableScan(explainResult, 2);
			expect(result).to.be(true);
		});

		it('should return false if cursor is not BasicCursor', function() {
			var explainResult = {
				collection: 'test',
		  		query: 'test',
			  	explaination: { 
			   		cursor: 'ChuckNorris',
				    nscannedObjects: 0,
				}
			}

			var result = inspector.queryPerformedFullTableScan(explainResult, 1);
			expect(result).to.be(false);
		});
	});

	describe('When parsing query entries', function() {
		var queryEntries1 = [
					{collection: 'test', query: { test: 'test' }},
					{collection: 'test', query: { $explain: '$explain' }}
				];

		var queryEntries2 = [
					{collection: 'test', query: { query: {query: 'query'}, orderby: {test : 1}}},
					{collection: 'test', query: { $query: {query: '$query'}, $orderby: {test : 1}}}
				];

		it('should return parsed query entries', function() {
			var result = inspector.parseQueryEntries(queryEntries1);
			expect(result).not.to.equal(null);
		});

		it('should ignore $explain keys', function() {
			var result = inspector.parseQueryEntries(queryEntries1);

			result.forEach(function(entry) {
				for(var key in entry.query) {
					expect(key.toString().indexOf('$explain')).to.be(-1);	
				}			
			});
		});

		it('should handle query and orderby keys correctly', function() {
			var result = inspector.parseQueryEntries(queryEntries2);

			result.forEach(function(entry) {
				expect(entry.query.query).not.to.equal(null);
			});
		});

		it('should add sort key in case orderby was used', function() {
			var result = inspector.parseQueryEntries(queryEntries2);

			result.forEach(function(entry) {
				expect(entry.query.query).not.to.equal(null);
				expect(entry.query.sort).not.to.equal(null);
			});
		});
	});
});