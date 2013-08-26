/* syncronous logger */
var fs = require('fs'),
	path = require('path'),
	mustache = require('mustache'),
	template = "Query: {{&query}}\r\napply index on fields: {{&missingIndexes}}\r\n\r\n";

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

	if (logFile.indexOf(logData.query) === -1) {
		return false;
	}

	return true;
}

function logToFile(pathName, fileName, logData) {
	var fullLogFilePath = path.join(pathName, fileName);

	_createFolderIfNotExists(pathName);
	_createLogFileIfNotExists(fullLogFilePath);

	if (!_logEntryExists(fullLogFilePath, logData)) {
		var logEntry = mustache.render(template, logData);
		console.log(logEntry);
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

exports.ToFile = logToFile;
exports.ToSockets = logToSockets;