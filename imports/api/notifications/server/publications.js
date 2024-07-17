import Notifications from '../notifications.js'

/**
 * Publishes all notifications for the current user.
 * @name 'mynotifications'
 * @returns {Mongo.Cursor} The cursor containing the notifications.
 
 */
Meteor.publish('mynotifications', function myProjects() {
  if (!this.userId) {
    return this.ready()
  }
  return Notifications.find({
    userId: this.userId,
  })
})
