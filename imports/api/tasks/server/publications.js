import { check } from 'meteor/check'
import Tasks from '../tasks.js'

Meteor.publish('mytasks', function mytasks(filter) {
  if (!this.userId) {
    return this.ready()
  }
  if (filter) {
    check(filter, String)
    // check(filter, String)
    return Tasks.find({ userId: this.userId, name: { $regex: `.*${filter}.*`, $options: 'i' } })
  }
  return Tasks.find({ userId: this.userId })
})
