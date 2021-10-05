import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import './connectioncheck.html'

Template.connectioncheck.events({
  'click #connectButton': (event) => {
    event.preventDefault()
    Meteor.reconnect()
  },
})
Template.connectioncheck.onCreated(() => {
  dayjs.extend(relativeTime)
})
Template.connectioncheck.helpers({
  offline: () => (Meteor.status().status === 'failed'
      || Meteor.status().status === 'waiting') && Meteor.status().retryCount > 1,
  nextRetry: () => dayjs(new Date(Meteor.status().retryTime)).fromNow(),
})
