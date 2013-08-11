var	fs = require('fs'),
	util = require('./utilities.js'), 
	path = require('path'),
	log = require('./../logger.js'),
	expect = require('expect.js');

describe('logger', function() {
	var testLogPath = "c:\\testData";
	var testLogFileName = "test.log";
	var fullTestLogPath = path.join(testLogPath, testLogFileName);

	describe('When logging to non existent log file', function() {
		it('should create a log file in the path specified', function() {
			log.logToFile(testLogPath, testLogFileName, 'logData');

			fs.exists(fullTestLogPath, function(exists) {
				expect(exists).to.be(true);
			});

		});

		// it('should append log data to log file if new log data is not yet present in log file', function() {
		// 	log.logToFile(testLogPath, testLogFileName, 'logData2');
		// 	// TODO: assert
		// });

	});



	// describe('When logging to exising log file', function() {
	// 	beforeEach(function(done) {
	// 		fs.exists(testLogPath, function(exists) {
	// 			if (!exists) {
	// 				fs.mkdir(testLogPath), function(err) {
	// 					if (err) throw err;	
	// 				}
	// 			}

	// 		  	fs.writeFile(fullTestLogPath, 'logData', function(err) {
	// 				if (err) throw err;
	// 			});
	// 			done();
	// 		});
	// 	});

	// 	afterEach(function(done) {
	// 		fs.exists(testLogPath, function(exists) {
	// 			if (exists) {
	// 				fs.removeRecursive(testLogPath, function(err, status) {
	// 					if (err) throw err;
	// 				});
	// 				done();
	// 			}
	// 		});
	// 	});

	// 	it('should append log data to log file', function() {
	// 		log.logToFile(testLogPath, testLogFileName, 'logData2');

	// 		fs.readFile(fullTestLogPath, 'utf8', function(err, data) {
	// 			expect(data).to.contain('logData2');
	// 		});

	// 	});

		// it('should append log data to log file if new log data is not yet present in log file', function() {
		// 	log.logToFile(testLogPath, testLogFileName, 'logData2');
		// 	// TODO: assert
		// });

	// });
});