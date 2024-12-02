#!/bin/bash
if [ -n "${MONGO_URL:-}" ]; then # Check for MongoDB connection if MONGO_URL is set
	# Poll until we can successfully connect to MongoDB
	echo 'Connecting to MongoDB...'
    cd bundle/programs/server/npm/node_modules/meteor/npm-mongo/node_modules
	node <<- 'EOJS'
	const mongoClient = require('mongodb').MongoClient;
	setInterval(async function() {
		let client;
		try {
			client = await mongoClient.connect(process.env.MONGO_URL);
		} catch (err) {
			console.error(err);
		}
		if (client && client.topology.isConnected()) {
			console.log('Successfully connected to MongoDB');
			client.close();
			process.exit(0);
		}
	}, 1000);
	EOJS
fi
cd /app
echo 'Starting titra...'
exec "$@"