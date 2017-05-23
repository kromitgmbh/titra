#!/bin/bash
set -eux
export MONGO_URL="${MONGODB_URL}"
export ROOT_URL="${APP_ORIGIN}"
export PORT=3000
exec /usr/local/bin/gosu cloudron:cloudron node /app/code/bundle/main.js
