/* syncronous logger */

var fs = require('fs'),
	path = require('path');

function _readLogFile(fullLogFilePath, query) {
	//check if log already contains the log data before writing
	var logFile = fs.readFileSync(fullLogFilePath).toString();

	if (logFile.indexOf(query) === -1) {
		var logEntry = 'Query without index detected: ' +  query + '\r\n';

		return logEntry;
	}
}

function _appendToLogFile(fullLogFilePath, logEntry) {
	var log = fs.createWriteStream(fullLogFilePath, { 'flags' : 'a' });
	
	if (logEntry) {
		console.log(logEntry);
		log.end(logEntry);	
	}
}

function logToFile(pathName, fileName, query) {
	var fullLogFilePath = path.join(pathName, fileName);

	var folderExists = fs.existsSync(pathName);

	if (!folderExists) {
		fs.mkdirSync(pathName);
	}

	var logFileExists = fs.existsSync(fullLogFilePath);

	if (!logFileExists) {
		fs.writeFileSync(fullLogFilePath, '');
	}

	var logEntry = _readLogFile(fullLogFilePath, query);
	_appendToLogFile(fullLogFilePath, logEntry);
}

exports.logToFile = logToFile;