/* syncronous logger */
var fs = require('fs'),
	path = require('path'),
	mustache = require('mustache'),
	cfg = require('./config.js'),
	template = "Query: {{&query}}\r\napply index on fields: {{&missingIndexes}}\r\n\r\n",
	logEntries = [];

function _readLogFile(fullLogFilePath) {
	return fs.readFileSync(fullLogFilePath).toString();
}

function _appendToLogFile(fullLogFilePath, logEntry) {
	if (logEntry) {
		var log = fs.createWriteStream(fullLogFilePath, { 'flags' : 'a' });
		log.end(logEntry);
		console.log(logEntry);
	}
}

function _createFolderIfNotExists(pathName) {
	var folderExists = fs.existsSync(pathName);

	if (!folderExists) {
		fs.mkdirSync(pathName);
	}
}

function _createLogFileIfNotExists(fullLogFilePath) {
	var logFileExists = fs.existsSync(fullLogFilePath);

	if (!logFileExists) {
		fs.writeFileSync(fullLogFilePath, '');
	}
}

function _logEntryExists(fullLogFilePath, logData) {
	var logFile = _readLogFile(fullLogFilePath);

	if (logData && logEntries.length === 0) {
		logEntries.push({ "collection": logData.collectionName, "keys": logData.missingIndexes });
	}

	// { collection: 'blog', keys: 'a,b,c'}
	var exists = logEntries.some(function(element, index, array) {
		if (element.collection === logData.collectionName && element.keys.toString() === logData.missingIndexes.toString()) {
			return true;
		}
	});

	if (exists) { return true; }

	return false;
}

function logToFile(logData) {
	var fullLogFilePath = path.join(cfg.log.path, cfg.log.fileName);

	_createFolderIfNotExists(cfg.log.path);
	_createLogFileIfNotExists(fullLogFilePath);

	if (!_logEntryExists(fullLogFilePath, logData)) {
		logEntries.push({ "collection": logData.collectionName, "keys": logData.missingIndexes });

		var logEntry = mustache.render(template, logData);
		_appendToLogFile(fullLogFilePath, logEntry);
	}
}

function logToSockets(clients, logData) {
	for (var client in clients) {
		var socket = clients[client];
		if (socket) {
			socket.emit('query', logData);	
		}
	}
}

exports.toFile = logToFile;
exports.toSockets = logToSockets;