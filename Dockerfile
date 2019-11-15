FROM node:8.16.2
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

FROM node:8.16.2-slim
RUN apt-get update && apt-get install -y python make g++ && rm -rf /var/lib/apt/lists/*
COPY --from=0 /build/*.tar.gz /app/bundle.tar.gz
WORKDIR /app/
RUN tar xvzf bundle.tar.gz
ENV PORT 3000
RUN cd /app/bundle/programs/server; npm install --production --silent;
#RUN apk del python make g++
EXPOSE 3000
CMD ["node", "bundle/main.js"]
