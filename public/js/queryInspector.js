window.onload = function () {
	var receivedqueries = [];
	var socket = io.connect();

	function createNewListEntry(msg) {
		var li = document.createElement('li');
		var headline = document.createElement('h4');
		var query = document.createElement('p');
		var indexKeys = document.createElement('p');

		headline.className = "text-error";
		headline.innerHTML = "Query without index detected";
		query.innerHTML = msg.query;
		indexKeys.innerHTML = "apply index on fields: <strong>" + msg.missingIndexes + "</strong>";		

		li.appendChild(headline);
		li.appendChild(document.createElement('hr'));
		li.appendChild(query);
		li.appendChild(indexKeys);

		document.getElementById('queryList').appendChild(li);
	}

	socket.on('query', function(msg) {
		if (receivedqueries.indexOf(msg.query) === -1) {
			receivedqueries.push(msg.query);
			createNewListEntry(msg);
		}
	});
}