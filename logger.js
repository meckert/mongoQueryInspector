var fs = require('fs'),
	path = require('path');

function logToFile(pathName, fileName, query) {
	var fullLogFilePath = path.join(pathName, fileName);

	fs.exists(fullLogFilePath, function(exists) {
		// if log file does not exist, create it
		if (!exists) {
			fs.mkdir(pathName), function(err) {
				if (err) throw err;	
			}
			
			fs.writeFile(fullLogFilePath, '', function(err) {
				if (err) throw err;
			});
		} else {
			// check if log already contains the log data before writing
			fs.readFile(fullLogFilePath, 'utf8', function(err, data) {
				if (err) throw err;

				if (data.indexOf(query) === -1) {
					var logEntry = 'Query without index detected: ' +  query + '\r\n';

					fs.appendFile(fullLogFilePath, logEntry, function(err) {
						if (err) throw err;
						console.log(logEntry);
					});
				}
			});
		}
	});
}

exports.logToFile = logToFile;