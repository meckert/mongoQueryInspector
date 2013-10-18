/* syncronous logger */
var fs = require('fs'),
	path = require('path'),
	mustache = require('mustache'),
	cfg = require('./config.json'),
	logEntries = [];

function _readLogFile(fullLogFilePath) {
	return fs.readFileSync(fullLogFilePath).toString();
}

function _appendToLogFile(fullLogFilePath, logEntry) {
	if (logEntry) {
		var log = fs.createWriteStream(fullLogFilePath, { 'flags' : 'a' });
		log.end(logEntry);
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

function _logEntryExists(logData) {
	if (logData && logEntries.length === 0) {
		return false;
	}

	// { collection: 'test', fields: 'a,b,c'}
	var exists = logEntries.some(function(element, index, array) {
		if (element.collection === logData.collectionName && element.fields.toString() === logData.missingIndexes.toString()) {
			return true;
		}
	});

	if (exists) { return true; }

	return false;
}

function _logToFile(logEntry) {
	var fullLogFilePath = path.join(cfg.log.path, cfg.log.fileName);

	_createFolderIfNotExists(cfg.log.path);
	_createLogFileIfNotExists(fullLogFilePath);
	_appendToLogFile(fullLogFilePath, logEntry);
}

function logInfo(infoMessage) {
	if (cfg.log.useTeamCityLog) {
		console.log('##teamcity[message text=\'' + infoMessage +'\']');
	} else {
		console.log(infoMessage);
	}
}

function logError(logData) {
	var errorHeaderTemplate = "\033[31mmissing index\033[39m\r\n";
	var errorTemplate = "Query: {{&query}}\r\napply index on fields: {{&missingIndexes}}\r\n\r\n";
	var teamCityTemplate = "##teamcity[message text='missingIndex' errorDetails='{{&query}}; Fields: {{&missingIndexes}}' status='ERROR']";
        var teamcityBuildError = "##teamcity[buildProblem description='Missing indexes.' identity='{{&missingIndexes}}']";

	if (!_logEntryExists(logData)) {
		logEntries.push({ "collection": logData.collectionName, "fields": logData.missingIndexes });
		
		if (cfg.log.useTeamCityLog) {
			var teamcityLogEntry = mustache.render(teamCityTemplate, logData);

            console.log(mustache.render(teamcityBuildError, logData));

            console.log(teamcityLogEntry);
		} else {
			var header = mustache.render(errorHeaderTemplate, logData);
			var logEntry = mustache.render(errorTemplate, logData);
			console.log(header + logEntry);
			_logToFile(logEntry);
		}
	}
}

exports.logInfo = logInfo;
exports.logError = logError;
