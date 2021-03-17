FROM node:12.21
ENV METEOR_ALLOW_SUPERUSER true
RUN curl https://install.meteor.com/ | sh
RUN meteor --version
WORKDIR /app/
COPY package.json .
RUN meteor npm install --production --silent
COPY public/ ./public/
COPY server/ ./server/
COPY client/ ./client/
COPY imports/ ./imports/
COPY .meteor/ ./.meteor/
RUN meteor build /build/ --server-only --architecture os.linux.x86_64

FROM node:12.21-slim
RUN apt-get update && apt-get install -y curl python make g++ && rm -rf /var/lib/apt/lists/*
COPY --from=0 /build/*.tar.gz /app/bundle.tar.gz
WORKDIR /app/
RUN tar xvzf bundle.tar.gz
RUN cd /app/bundle/programs/server; npm install --production --silent; npm prune --production;
RUN curl -sfL https://gobinaries.com/tj/node-prune -o /tmp/node-prune.sh
RUN chmod +x /tmp/node-prune.sh
RUN /tmp/node-prune.sh
RUN rm -r /app/bundle/programs/server/npm/node_modules/meteor/babel-compiler/node_modules/typescript
RUN rm -r /app/bundle/programs/server/npm/node_modules/meteor/babel-compiler/node_modules/@babel
RUN rm -r /app/bundle/programs/server/npm/node_modules/meteor/minifier-css/
RUN rm -r /app/bundle/programs/server/npm/node_modules/@neovici/nullxlsx/cc-test-reporter

FROM node:12.21-slim
ENV PORT 3000
EXPOSE 3000
WORKDIR /app/
COPY --from=1 app/bundle bundle
CMD ["node", "bundle/main.js"]
