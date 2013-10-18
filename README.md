## mongoQueryInspector (v0.2.3-beta)
Inspect mongoDB queries to find queries not using an index.

mongoQueryInspector is written in [Node](http://www.nodejs.org/).

Please note: mongoQueryInspector is NOT intended for usage on a production system!

### How it works

mongoQueryInspector uses system.profile collections to analyze mongo queries. 
In order to analyze all queries for a specific database, follow these steps:

1. [Enable database profiling](http://docs.mongodb.org/manual/tutorial/manage-the-database-profiler/) for the database(s) you want to analyze. You need to set the profiling level to 2 (db.setProfilingLevel(2)).

2. Open fire! Start using your application/run your queries.

3. Edit the config.json file and change it according to your MongoDB setup.

4. Start mongo query inspector and analyze the results


### Installation

1. clone the repository
2. use npm install:
```
npm install
```

### Configuration

For logging and database configuration edit the [config.json](https://github.com/meckert/mongoQueryInspector/blob/master/config.json) file:
```
"log": {
	"path": "c:\\temp" - The path where the log file will be created. Use '\\' when specifying the path.
	"fileName": "mongoQueryInspector.log" - The name of the log file to be created.
	"useTeamCityLog": true - [true]=logging to console in Team City format. No logs will be written to the log file; [false]=normal logging to console.
},
"databases": [
	"mongodb://user:passwd@host:port/database"
]

You can specify as many databases as you like. Each DB in the databases array will be analyzed by mongo query inspector.

### Usage

Start app.js with node:
```
$node app.js
```

If a query is detected that is not using an index, a log entry is written to console and to the log file you specified in the configuration.