var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	data = require('./data.js'),
	log = require('./logger.js'),
	cfg = require('./config.js');

// TODO:

// - write tests / fix tests

server.listen(3000);
app.use(express.static(__dirname + '/public/'));

var clients = {};

io.sockets.on('connection', function(socket) {
	clients[socket.id] = socket;
});

var credentials = cfg.mongo.credentials;

for (var i=0; i < credentials.length; i++) {
	var dbName = credentials[i].dbName || '';
	var username = credentials[i].username || '';
	var password = credentials[i].password || '';

	data.connect(cfg.mongo.uri, cfg.mongo.port, dbName, username, password, connected);

	function connected(client) {
		function watchQueries() {
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
									var logEntry = { 'query' : explainResult.query, 'missingIndexes' : missingIndexes };

									log.ToFile(cfg.log.path, cfg.log.fileName, logEntry);
									log.ToSockets(clients, logEntry);
								});	
							}


						});						
					}
				}
			}

			setTimeout(watchQueries, cfg.log.Interval);
		}
		watchQueries();
	}
}