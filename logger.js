/* syncronous logger */
var fs = require('fs'),
	path = require('path');

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

function logToFile(pathName, fileName, logData) {
	var fullLogFilePath = path.join(pathName, fileName);

	_createFolderIfNotExists(pathName);
	_createLogFileIfNotExists(fullLogFilePath);

	var logFile = _readLogFile(fullLogFilePath, logData);

	if (logFile.indexOf(logData) === -1) {
		_appendToLogFile(fullLogFilePath, logData + '\r\n');
	}
}

exports.logToFile = logToFile;