var data = require('./../data.js'),
	expect = require('expect.js');

// TODO:
// - create setup for test db and use test db

describe('data', function() {

	describe('When connecting to database', function() {
		it('should return the database client', function(done) {
			data.connect('localhost', '27017', 'blog', 'blog', 'qwer', function(client) {
				expect(client).not.to.equal(null);
				done();
			});
		});
	});

	describe('When finding all system profile queries', function() {
		it('should return queries', function(done) {
			data.connect('localhost', '27017', 'blog', 'blog', 'qwer', function(client) {
				data.findAllSystemProfileQueries(client, function(queries) {
					expect(queries).not.to.equal(null);
					expect(queries.length).to.be.greaterThan(0);
					done();
				});
			});
		});

		it('should only return queries not including $query and not including $explain', function(done) {
			data.connect('localhost', '27017', 'blog', 'blog', 'qwer', function(client) {
				data.findAllSystemProfileQueries(client, function(queries) {
					for(var query in queries) {
						for (var key in queries[query].query) {
							expect(queries[query].query[key].toString().indexOf('$query')).to.be(-1);
							expect(queries[query].query[key].toString().indexOf('$explain')).to.be(-1);
						}
					}
					done();
				});
			});
		});
	});

	describe('When calling explain on queries', function() {
		it('should return explain result including full query text', function(done) {
			data.connect('localhost', '27017', 'blog', 'blog', 'qwer', function(client) {
				data.findAllSystemProfileQueries(client, function(queries) {
					data.callExplainOnQueries(client, queries, function(explainResult) {
						expect(explainResult).not.to.equal(null);
						expect(explainResult.query).not.to.equal(null);
					});
					done();
				});
			});
		});

		it('should return explain result including query explaination', function(done) {
			data.connect('localhost', '27017', 'blog', 'blog', 'qwer', function(client) {
				data.findAllSystemProfileQueries(client, function(queries) {
					data.callExplainOnQueries(client, queries, function(explainResult) {
						expect(explainResult.explaination).not.to.equal(null);
					});
					done();
				});
			});
		});
	});
});