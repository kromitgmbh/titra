![Docker Build Status](https://img.shields.io/docker/cloud/build/kromit/titra.svg) ![Docker Pulls](https://img.shields.io/docker/pulls/kromit/titra.svg) ![Latest Release](https://img.shields.io/github/v/release/kromitgmbh/titra.svg)


# ![titra logo](public/favicons/favicon-32x32.png) titra
Modern open source project time tracking for freelancers and small teams

We believe in the philosophy ["Do One Thing And Do It Well."](https://en.wikipedia.org/wiki/Unix_philosophy#Do_One_Thing_and_Do_It_Well) and try to follow it in the design and implementation of titra. A great companion for titra is [Wekan](https://wekan.io), where you can plan your tasks and track your time against later on.

## No risk, no fun, just time tracking
According to the philosophy described above, titra has been built to be the easiest, most convenient and modern way to track your time spent on projects. We want you to get started tracking your time as fast and with the least distractions as possible. After tracking your time, the second most important aspect is the ability to report and export your tracked time efficiently.

## Try it!
We are providing a hosted version of titra free of charge at [app.titra.io](https://app.titra.io). Create an account in seconds and start tracking your time!

There is no better time to get started, titra just got a dark mode 🌑 and it is 🔥!

## Running with Docker Compose
Here is a one-line example on how to get started with titra locally if you have [docker-compose](https://docs.docker.com/compose/) installed:
```
curl -L https://github.com/faburem/titra/raw/master/docker-compose.yml | ROOT_URL=http://localhost:3000 docker-compose -f - up
```

This will pull in the latest titra release and spin up a local Mongodb v4.0 instance and link them together.
Congratulations! titra should now be up and running at http://localhost:3000

## Deploy on DigitalOcean
titra is available in the [DigitalOcean Marketplace](https://marketplace.digitalocean.com/apps/titra) for easy 1-click deployment of droplets. Get started below:
[![do-btn-blue](https://user-images.githubusercontent.com/11456790/74553033-c9399f80-4f56-11ea-9f9f-6f1ac4af50ce.png)](https://cloud.digitalocean.com/droplets/new?image=kromit-titra-18-04#choose-droplet-size)


## Documentation and more
Checkout our [wiki](https://titra.io/en/wiki/) for best practices and to learn how to setup interfaces with external tools like Wekan.



Built with ❤️by [kromit](https://kromit.at) in 🇦🇹
