#!/bin/bash
if [ -n "${MONGO_URL:-}" ]; then # Check for MongoDB connection if MONGO_URL is set
	# Poll until we can successfully connect to MongoDB
	echo 'Connecting to MongoDB...'
    cd bundle/programs/server/npm/node_modules/meteor/npm-mongo/node_modules
	node <<- 'EOJS'
	const mongoClient = require('mongodb').MongoClient;
	setInterval(function() {
		mongoClient.connect(process.env.MONGO_URL, function(err, client) {
			if (client) {
				console.log('Successfully connected to MongoDB');
				client.close();
			}
			if (err) {
				console.error(err);
			} else {
				process.exit(0);
			}
		});
	}, 1000);
	EOJS
fi
cd /app
echo 'Starting titra...'
exec "$@"