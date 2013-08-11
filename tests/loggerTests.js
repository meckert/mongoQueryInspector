var	fs = require('fs'),
	path = require('path'),
	log = require('./../logger.js'),
	expect = require('expect.js');


describe('logger', function() {
	var testLogPath = __dirname;
	var testLogFileName = "test.log";
	var fullTestLogPath = path.join(testLogPath, testLogFileName);

	var deleteTestLogFile = function() {
		var logFileExists = fs.existsSync(fullTestLogPath);

		if (logFileExists) {
			fs.unlinkSync(fullTestLogPath);
		}
	}

	var createTestLogFile = function() {
		var logFileExists = fs.existsSync(fullTestLogPath);

		if (!logFileExists) {
			fs.writeFileSync(fullTestLogPath, '');
		}
	}

	afterEach(function() {
		deleteTestLogFile();
	});

	describe('When logging to non existent log file', function() {
		beforeEach(function() {
			deleteTestLogFile();
		});

		it('should create a log file in the path specified', function() {
			log.logToFile(testLogPath, testLogFileName, 'logData');

			var exists = fs.existsSync(fullTestLogPath);
			expect(exists).to.be(true);
		});

		it('should append the log text to the log file', function() {
			log.logToFile(testLogPath, testLogFileName, 'logData2');

			var data = fs.readFileSync(fullTestLogPath, 'utf8');
			expect(data).to.contain('logData2');
		});
	});

	describe('When logging to existent log file', function() {
		beforeEach(function() {
			createTestLogFile();
		});

		it('should append the log text to the log file', function() {
			log.logToFile(testLogPath, testLogFileName, 'logData3');

			var data = fs.readFileSync(fullTestLogPath, 'utf8');
			expect(data).to.contain('logData3');
		});

		it('should only append the log text to the log file once', function() {
			log.logToFile(testLogPath, testLogFileName, 'logData4');
			log.logToFile(testLogPath, testLogFileName, 'logData4');
			log.logToFile(testLogPath, testLogFileName, 'logData4');

			var data = fs.readFileSync(fullTestLogPath, 'utf8');
			var logEntryCount = data.match(/logData4/g).length;

			expect(logEntryCount).to.be(1);
		});
	});
});