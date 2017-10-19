import Notifications from '../notifications.js'

Meteor.publish('mynotifications', function myProjects() {
  if (!this.userId) {
    return this.ready()
  }
  return Notifications.find({
    userId: this.userId,
  })
})
