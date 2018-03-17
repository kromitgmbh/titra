![Docker Build Status](https://img.shields.io/docker/build/kromit/titra.svg) ![Docker Pulls](https://img.shields.io/docker/pulls/kromit/titra.svg)


# ![titra logo](public/favicons/favicon-32x32.png) titra
modern open source time tracking for small companies

titra has been orginally designed for [sandstorm](https://sandstorm.io). Unfortunately that platform is not going where we expected, so we are shipping titra exclusively as Docker image (get it [here](https://hub.docker.com/r/kromit/titra/)) now. A great companion for titra is [Wekan](https://wekan.io), where you can plan your tasks and track your time against later on.


## Deploying with Docker
You will need a MongoDB container to use titra. Here is an example to get started:
docker run --name mongodb -p 27017:27017 mongo

titra needs to be aware of that container, an easy way to achieve this is using --link
docker run --name titra -p 3000:3000 --link mongodb -e MONGO_URL=mongodb://mongodb/titra -e ROOT_URL=http://localhost:3000 kromit/titra

Congratulations! titra should now be available at http://localhost:3000


## Wekan integration
Checkout our [wiki](https://github.com/faburem/titra/wiki/Wekan-integration) for more information!



Built with :heart: by [kromit](https://kromit.at) in 🇦🇹
