## mongoQueryInspector (v0.1.0-beta)
Inspect mongoDB queries to find queries not using an index.

mongoQueryInspector is written for [Node](http://www.nodejs.org/).

Please note: mongoQueryInspector is NOT intended for usage on a production system!

### How it works

mongoQueryInspector uses system.profile collections to analyze mongo queries. 
In order to analyze all queries for a specific database, follow these steps:

1. [Enable database profiling](http://docs.mongodb.org/manual/tutorial/manage-the-database-profiler/) for the database(s) you want to analyze. You need to set the profiling level to 2 (db.setProfilingLevel(2)).

2. Open fire! Start using your application.


### Installation

1. clone the repository
2. use npm install:
```
npm install
```

### Configuration

For logging and database configuration edit the [config.js](https://github.com/meckert/mongoQueryInspector/blob/master/config.js) file:
```
config.log.path = 'c:\\temp'; // The path where the log file will be created. Use '\\' when specifying the path.
config.log.fileName = 'mongoQueryInspector.log'; // The name of the log file to be created.
config.log.Interval = 5000; // The interval in milliseconds specifying how often the system.profile collections are analyzed.

config.mongo = {};
config.mongo.uri = '127.0.0.1';
config.mongo.port = '27017';
// Specify all the databases you want to analyze.
// If you use authentication you need to add username and password. If don't use authentication, omit username and password.
config.mongo.credentials =  [
								{dbName : 'blog', username: 'blog', password: 'qwer'},
								{dbName : 'enron', username: 'enron', password: 'qwer'},
							]
```

### Usage

Start app.js with node:
```
node app.js
```

If a query is detected that is not using an index, a log entry will be added to the log file you specified in the configuration.
